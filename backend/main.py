import os
import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS

from utils.document_handler import load_prompts_metadata, read_file, process_document, process_multiple_documents
from utils.logging_config import setup_logging
from utils.local_ai import local_ai
from utils.file_manager import file_manager as old_file_manager
from utils.unified_file_manager import unified_file_manager
from config import Config

app = Flask(__name__)
app.config.from_object(Config)
CORS(app)  # Activer CORS pour le frontend

os.makedirs(app.config['ANALYZED_FILES_FOLDER'], exist_ok=True)

logger = setup_logging()

# Stockage global de la file d'analyse
analysis_queue = []

@app.route("/api/health", methods=["GET"])
def health_check():
    """Route de vérification de santé du backend"""
    return jsonify({"status": "ok", "message": "Backend opérationnel"})

@app.route("/api/ai-status", methods=["GET"])
def ai_status():
    """Route pour vérifier le statut des IA disponibles"""
    openai_available = bool(Config.OPENAI_API_KEY)
    local_ai_available = local_ai.is_available()
    
    return jsonify({
        "openai": {
            "available": openai_available,
            "configured": bool(Config.OPENAI_API_KEY)
        },
        "local": {
            "available": local_ai_available,
            "models": local_ai.get_available_models() if local_ai_available else []
        }
    })

@app.route("/api/prompts", methods=["GET"])
def get_prompts():
    prompts = load_prompts_metadata(app.config['PROMPTS_JSON'])
    return jsonify(prompts)

# Nouvelles routes pour la gestion des fichiers par état
@app.route("/api/file-management/register", methods=["POST"])
def register_file():
    """Enregistre un fichier dans le système unifié"""
    data = request.get_json()
    if not data or 'file_path' not in data:
        return jsonify({"success": False, "error": "Chemin du fichier manquant"}), 400
    
    file_path = data['file_path']
    original_path = data.get('original_path', file_path)
    
    if not os.path.exists(file_path):
        return jsonify({"success": False, "error": "Fichier introuvable"}), 404
    
    try:
        analyzed_filename = unified_file_manager.add_file(file_path, "pending")
        file_info = unified_file_manager.registry["files"][analyzed_filename]
        
        return jsonify({
            "success": True,
            "file_id": analyzed_filename,
            "file_info": file_info
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/file-management/status", methods=["GET"])
def get_file_status():
    """Récupère le statut d'un fichier avec le système unifié"""
    file_path = request.args.get('file_path')
    if not file_path:
        return jsonify({"success": False, "error": "Chemin du fichier manquant"}), 400
    
    # Utiliser le nouveau système unifié
    status = unified_file_manager.get_file_status(file_path)
    analysis_info = unified_file_manager.get_file_analysis(file_path)
    
    response_data = {
        "success": True,
        "status": status
    }
    
    if analysis_info:
        response_data.update({
            "analysis": analysis_info.get("analysis"),
            "error": analysis_info.get("error"),
            "file_id": analysis_info.get("file_id"),
            "analyzed_at": analysis_info.get("analyzed_at")
        })
    
    return jsonify(response_data)

@app.route("/api/file-management/files", methods=["GET"])
def get_files_by_status():
    """Récupère les fichiers par statut avec le système unifié"""
    status = request.args.get('status')
    
    if status:
        # Filtrer par statut
        files = []
        for file_info in unified_file_manager.registry["files"].values():
            if file_info["status"] == status:
                files.append(file_info)
    else:
        # Tous les fichiers
        files = list(unified_file_manager.registry["files"].values())
    
    return jsonify({
        "success": True,
        "files": files
    })

@app.route("/api/file-management/statistics", methods=["GET"])
def get_file_statistics():
    """Récupère les statistiques des fichiers avec le système unifié"""
    stats = {}
    
    # Compter par statut
    for file_info in unified_file_manager.registry["files"].values():
        status = file_info["status"]
        if status not in stats:
            stats[status] = {"count": 0, "total_size": 0}
        stats[status]["count"] += 1
        stats[status]["total_size"] += file_info.get("size", 0)
    
    return jsonify({
        "success": True,
        "statistics": stats
    })

@app.route("/api/file-management/scan-directory", methods=["POST"])
def scan_directory_with_status():
    """Scanne un répertoire et retourne les fichiers avec leur statut (système unifié)"""
    data = request.get_json()
    if not data or 'directory_path' not in data:
        return jsonify({"success": False, "error": "Chemin du répertoire manquant"}), 400
    
    directory_path = data['directory_path']
    
    if not os.path.exists(directory_path):
        return jsonify({"success": False, "error": "Répertoire introuvable"}), 404
    
    try:
        files = unified_file_manager.get_files_in_directory(directory_path)
        return jsonify({
            "success": True,
            "files": files
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/file-management/archive", methods=["POST"])
def archive_file():
    """Archive un fichier"""
    data = request.get_json()
    if not data or 'file_id' not in data:
        return jsonify({"success": False, "error": "ID du fichier manquant"}), 400
    
    file_id = data['file_id']
    
    try:
        success = file_manager.archive_file(file_id)
        if success:
            return jsonify({"success": True, "message": "Fichier archivé"})
        else:
            return jsonify({"success": False, "error": "Impossible d'archiver le fichier"}), 500
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/file-management/cleanup", methods=["POST"])
def cleanup_old_files():
    """Nettoie les anciens fichiers archivés"""
    data = request.get_json() or {}
    days = data.get('days', 30)
    
    try:
        cleaned_count = file_manager.cleanup_old_files(days)
        return jsonify({
            "success": True,
            "cleaned_count": cleaned_count,
            "message": f"{cleaned_count} fichiers nettoyés"
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/file-metadata", methods=["POST"])
def get_file_metadata():
    """Récupère les métadonnées d'un fichier"""
    data = request.get_json()
    if not data or 'file_path' not in data:
        return jsonify({"success": False, "error": "Chemin du fichier manquant"}), 400
    
    file_path = data['file_path']
    
    if not os.path.exists(file_path):
        return jsonify({"success": False, "error": "Fichier introuvable"}), 404
    
    try:
        stat = os.stat(file_path)
        
        # Vérifier le statut dans le système unifié
        status = unified_file_manager.get_file_status(file_path)
        analysis_info = unified_file_manager.get_file_analysis(file_path)
        
        # Récupérer l'analyse si disponible
        analysis = None
        if analysis_info:
            analysis = analysis_info.get("analysis")
        
        return jsonify({
            "success": True,
            "data": {
                "path": file_path,
                "name": os.path.basename(file_path),
                "size": stat.st_size,
                "modified": datetime.datetime.fromtimestamp(stat.st_mtime).isoformat(),
                "status": status,
                "analysis": analysis
            }
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/analyze", methods=["POST"])
def analyze_file():
    """Analyse un fichier avec l'IA"""
    data = request.get_json()
    if not data or 'file_path' not in data:
        return jsonify({"success": False, "error": "Chemin du fichier manquant"}), 400
    
    file_path = data['file_path']
    ia_mode = data.get('ia_mode', 'openai')
    prompt_id = data.get('prompt_id')
    overwrite = data.get('overwrite', False)
    
    if not os.path.exists(file_path):
        return jsonify({"success": False, "error": "Fichier introuvable"}), 404
    
    try:
        # Enregistrer le fichier s'il ne l'est pas déjà
        file_id = file_manager.registry.find_file_by_path(file_path)
        if not file_id:
            file_id = file_manager.add_file(file_path, file_path)
        
        # S'assurer que file_id n'est pas None
        if not file_id:
            return jsonify({"success": False, "error": "Impossible d'enregistrer le fichier"}), 500
        
        # Vérifier si le fichier a déjà été analysé et si on ne veut pas écraser
        if not overwrite:
            file_info = file_manager.registry.get_file_info(file_id)
            if file_info and file_info.get("status") == "completed":
                return jsonify({"success": False, "error": "Fichier déjà analysé"}), 409
        
        # Marquer comme en cours d'analyse
        file_manager.start_analysis(file_id)
        
        # Charger les prompts
        prompts = load_prompts_metadata(app.config['PROMPTS_JSON'])
        if not prompts:
            if file_id:
                file_manager.mark_as_failed(file_id, "Aucun prompt disponible")
            return jsonify({"success": False, "error": "Aucun prompt disponible"}), 500
        
        # Utiliser le prompt spécifié ou le premier par défaut
        if not prompt_id:
            prompt_id = prompts[0]['id']
        
        # Traiter le document
        result = process_document(file_path, prompt_id, ia_mode)
        
        if result.get('success'):
            analysis = result.get('analysis', 'Analyse terminée')
            file_manager.complete_analysis(file_id, analysis)
            
            return jsonify({
                "success": True,
                "data": analysis,
                "ia_mode": result.get('ia_mode', ia_mode),
                "file_id": file_id
            })
        else:
            error_msg = result.get('error', 'Erreur lors de l\'analyse')
            file_manager.mark_as_failed(file_id, error_msg)
            return jsonify({"success": False, "error": error_msg}), 500
            
    except Exception as e:
        # Marquer comme échoué en cas d'erreur
        if 'file_id' in locals():
            file_manager.mark_as_failed(file_id, str(e))
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/analyze-multi", methods=["POST"])
def analyze_multiple_files():
    """Analyse plusieurs fichiers avec un prompt spécifique"""
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "error": "Données manquantes"}), 400
    
    file_paths = data.get('file_paths', [])
    prompt_id = data.get('prompt_id')
    ia_mode = data.get('ia_mode', 'openai')
    
    if not file_paths:
        return jsonify({"success": False, "error": "Aucun fichier fourni"}), 400
    
    if not prompt_id:
        return jsonify({"success": False, "error": "ID du prompt manquant"}), 400
    
    try:
        # Charger les prompts
        prompts = load_prompts_metadata(app.config['PROMPTS_JSON'])
        prompt = next((p for p in prompts if p['id'] == prompt_id), None)
        
        if not prompt:
            return jsonify({"success": False, "error": "Prompt non trouvé"}), 404
        
        # Vérifier que tous les fichiers existent
        for file_path in file_paths:
            if not os.path.exists(file_path):
                return jsonify({"success": False, "error": f"Fichier introuvable: {file_path}"}), 404
        
        # Traiter les documents
        if prompt.get('multi_document', False):
            result = process_multiple_documents(file_paths, prompt, ia_mode)
        else:
            # Pour les prompts mono-document, traiter le premier fichier
            result = process_document(file_paths[0], prompt, ia_mode)
        
        return jsonify({
            "success": True,
            "result": result,
            "files_processed": len(file_paths)
        })
        
    except Exception as e:
        logger.error(f"Erreur lors de l'analyse multi-fichiers: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/contextual-prompt", methods=["POST"])
def contextual_prompt():
    """Génère un prompt contextuel basé sur le contenu du fichier"""
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "error": "Données manquantes"}), 400
    
    file_path = data.get('file_path')
    prompt_type = data.get('prompt_type', 'general')  # general, summary, extraction, etc.
    
    if not file_path:
        return jsonify({"success": False, "error": "Chemin du fichier manquant"}), 400
    
    if not os.path.exists(file_path):
        return jsonify({"success": False, "error": "Fichier introuvable"}), 404
    
    try:
        # Lire le contenu du fichier
        file_content = read_file(file_path)
        if not file_content:
            return jsonify({"success": False, "error": "Impossible de lire le contenu du fichier"}), 500
        
        # Générer un prompt contextuel basé sur le contenu
        contextual_prompt = generate_contextual_prompt(file_content, prompt_type)
        
        return jsonify({
            "success": True,
            "contextual_prompt": contextual_prompt,
            "file_path": file_path,
            "prompt_type": prompt_type
        })
        
    except Exception as e:
        logger.error(f"Erreur lors de la génération du prompt contextuel: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

def generate_contextual_prompt(content, prompt_type):
    """Génère un prompt contextuel basé sur le contenu et le type demandé"""
    # Limiter le contenu pour l'analyse
    content_preview = content[:2000] if len(content) > 2000 else content
    
    base_prompts = {
        'general': f"Analyse ce document et fournis une synthèse générale :\n\n{content_preview}",
        'summary': f"Crée un résumé structuré de ce document :\n\n{content_preview}",
        'extraction': f"Extrais les informations clés de ce document (dates, montants, noms, etc.) :\n\n{content_preview}",
        'classification': f"Classifie ce document selon son type, secteur d'activité et urgence :\n\n{content_preview}",
        'questions': f"Génère 5 questions pertinentes sur ce document :\n\n{content_preview}",
        'action_items': f"Identifie les points d'action et échéances dans ce document :\n\n{content_preview}"
    }
    
    return base_prompts.get(prompt_type, base_prompts['general'])

@app.route("/api/analyzed-files", methods=["GET"])
def list_analyzed_files():
    analyzed_folder = app.config['ANALYZED_FILES_FOLDER']
    files = []
    
    if os.path.exists(analyzed_folder):
        for fname in os.listdir(analyzed_folder):
            fpath = os.path.join(analyzed_folder, fname)
        if os.path.isfile(fpath) and not fname.endswith('.meta'):
            meta_path = fpath + ".meta"
            original_name = None
            if os.path.exists(meta_path):
                try:
                    import json
                    with open(meta_path, "r", encoding="utf-8") as meta_file:
                        meta = json.load(meta_file)
                        original_name = meta.get("original_name")
                except Exception:
                    original_name = None
            files.append({
                "id": fname,
                "name": fname,
                "original_name": original_name,
                "status": "analysed",
                "selected": False
            })
    
    return jsonify(files)

@app.route("/api/analyzed-files/<filename>", methods=["GET"])
def get_analyzed_file_info(filename):
    import datetime
    folder = app.config['ANALYZED_FILES_FOLDER']
    fpath = os.path.join(folder, filename)
    if not os.path.isfile(fpath):
        return jsonify({"error": "Fichier introuvable"}), 404
    stat = os.stat(fpath)
    # Lecture du texte du fichier
    from utils.document_handler import read_file, analyse_document_with_text, load_prompts_metadata
    try:
        text = read_file(fpath)
    except Exception as e:
        text = ""
    # Sélection du prompt par défaut (le premier du catalogue)
    prompts = load_prompts_metadata(app.config['PROMPTS_JSON'])
    prompt_id = prompts[0]['id'] if prompts else None
    
    return jsonify({
        "filename": filename,
        "size": stat.st_size,
        "modified": datetime.datetime.fromtimestamp(stat.st_mtime).isoformat(),
        "text_preview": text[:500] + "..." if len(text) > 500 else text,
        "prompt_id": prompt_id
    })


@app.route("/api/tree-structure", methods=["POST"])
def get_tree_structure():
    """Retourne l'arborescence complète d'un répertoire"""
    data = request.get_json()
    if not data or 'path' not in data:
        return jsonify({"error": "Chemin du répertoire manquant"}), 400
    
    root_path = data['path']
    
    if not os.path.exists(root_path):
        return jsonify({"error": "Répertoire introuvable"}), 404
    
    if not os.path.isdir(root_path):
        return jsonify({"error": "Le chemin spécifié n'est pas un répertoire"}), 400
    
    def build_tree(path, relative_path=""):
        """Construit l'arborescence récursivement"""
        tree = []
        allowed_extensions = app.config['ALLOWED_EXTENSIONS']
        
        try:
            items = os.listdir(path)
            # Trier : dossiers d'abord, puis fichiers
            dirs = []
            files = []
            
            for item in items:
                item_path = os.path.join(path, item)
                if os.path.isdir(item_path):
                    dirs.append(item)
                elif os.path.isfile(item_path):
                    # Vérifier l'extension
                    file_ext = item.rsplit('.', 1)[1].lower() if '.' in item else ''
                    if file_ext in allowed_extensions:
                        files.append(item)
            
            # Ajouter les dossiers
            for dir_name in sorted(dirs):
                dir_path = os.path.join(path, dir_name)
                dir_relative_path = os.path.join(relative_path, dir_name) if relative_path else dir_name
                
                # Récupérer les sous-éléments
                children = build_tree(dir_path, dir_relative_path)
                
                tree.append({
                    "id": dir_relative_path,
                    "name": dir_name,
                    "type": "directory",
                    "path": dir_path,
                    "relative_path": dir_relative_path,
                    "children": children,
                    "expanded": False,
                    "selected": False
                })
            
            # Ajouter les fichiers
            for file_name in sorted(files):
                file_path = os.path.join(path, file_name)
                file_relative_path = os.path.join(relative_path, file_name) if relative_path else file_name
                
                stat = os.stat(file_path)
                tree.append({
                    "id": file_relative_path,
                    "name": file_name,
                    "type": "file",
                    "path": file_path,
                    "relative_path": file_relative_path,
                    "size": stat.st_size,
                    "modified": datetime.datetime.fromtimestamp(stat.st_mtime).isoformat(),
                    "status": "unprocessed",
                    "selected": False
                })
                
        except Exception as e:
            # En cas d'erreur d'accès, on continue
            pass
        
        return tree
    
    try:
        tree_structure = build_tree(root_path)
        return jsonify({
            "success": True,
            "data": tree_structure
        })
    except Exception as e:
        return jsonify({"success": False, "error": f"Erreur lors de la construction de l'arborescence : {str(e)}"}), 500

@app.route('/api/validate-key', methods=['POST'])
def validate_api_key():
    """Valide une clé API en testant une requête simple"""
    try:
        data = request.get_json()
        provider = data.get('provider')
        key = data.get('key')
        
        if not provider or not key:
            return jsonify({'valid': False, 'error': 'Provider et clé requis'}), 400
        
        # Validation selon le provider
        if provider == 'openai':
            try:
                import openai
                client = openai.OpenAI(api_key=key)
                # Test simple avec un prompt minimal
                response = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[{"role": "user", "content": "Test"}],
                    max_tokens=5
                )
                return jsonify({'valid': True})
            except Exception as e:
                return jsonify({'valid': False, 'error': str(e)})
        
        elif provider == 'claude':
            try:
                import anthropic
                client = anthropic.Anthropic(api_key=key)
                # Test simple avec un prompt minimal
                response = client.messages.create(
                    model="claude-3-haiku-20240307",
                    max_tokens=5,
                    messages=[{"role": "user", "content": "Test"}]
                )
                return jsonify({'valid': True})
            except Exception as e:
                return jsonify({'valid': False, 'error': str(e)})
        
        elif provider == 'mistral':
            try:
                import requests
                headers = {
                    'Authorization': f'Bearer {key}',
                    'Content-Type': 'application/json'
                }
                data = {
                    'model': 'mistral-tiny',
                    'messages': [{'role': 'user', 'content': 'Test'}],
                    'max_tokens': 5
                }
                response = requests.post(
                    'https://api.mistral.ai/v1/chat/completions',
                    headers=headers,
                    json=data,
                    timeout=10
                )
                if response.status_code == 200:
                    return jsonify({'valid': True})
                else:
                    return jsonify({'valid': False, 'error': f'Status {response.status_code}'})
            except Exception as e:
                return jsonify({'valid': False, 'error': str(e)})
        
        else:
            return jsonify({'valid': False, 'error': 'Provider non supporté'}), 400
            
    except Exception as e:
        return jsonify({'valid': False, 'error': str(e)}), 500

@app.route('/api/analysis-queue', methods=['GET'])
def get_analysis_queue():
    """Récupère la file d'analyse actuelle"""
    return jsonify(analysis_queue)

@app.route('/api/analysis-queue', methods=['POST'])
def add_to_analysis_queue():
    """Ajoute des tâches à la file d'analyse"""
    global analysis_queue
    try:
        data = request.get_json()
        tasks = data.get('tasks', [])
        
        # Ajouter les nouvelles tâches
        analysis_queue.extend(tasks)
        
        return jsonify({"success": True, "queue": analysis_queue})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/analysis-queue/<task_id>', methods=['PUT'])
def update_analysis_task(task_id):
    """Met à jour le statut d'une tâche d'analyse"""
    global analysis_queue
    try:
        data = request.get_json()
        
        # Trouver et mettre à jour la tâche
        for task in analysis_queue:
            if task['id'] == task_id:
                task.update(data)
                break
        
        return jsonify({"success": True, "queue": analysis_queue})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/analysis-queue', methods=['DELETE'])
def clear_analysis_queue():
    """Vide la file d'analyse"""
    global analysis_queue
    analysis_queue = []
    return jsonify({"success": True, "queue": analysis_queue})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
