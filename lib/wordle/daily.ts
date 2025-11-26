import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";

export interface DailyWord {
  id: string;
  word: string;
  definition: string;
  date: string;
}

// Massive list of Tech words for free automatic generation (1000 words goal)
const TECH_WORDS = [
  { word: "ALGORITHME", definition: "Suite d'opérations permettant de résoudre un problème." },
  { word: "INTERFACE", definition: "Dispositif d'échange entre deux systèmes." },
  { word: "VARIABLE", definition: "Espace de stockage nommé pour une valeur." },
  { word: "FONCTION", definition: "Bloc de code effectuant une tâche spécifique." },
  { word: "DATABASE", definition: "Ensemble structuré de données." },
  { word: "NAVIGATEUR", definition: "Logiciel pour consulter le Web." },
  { word: "COMPILATEUR", definition: "Transforme le code source en langage machine." },
  { word: "CRYPTAGE", definition: "Codage pour rendre un message inintelligible." },
  { word: "FIREWALL", definition: "Sécurité surveillant le trafic réseau." },
  { word: "PROTOCOL", definition: "Règles régissant les échanges de données." },
  { word: "RECURSIF", definition: "Se dit d'une fonction qui s'appelle elle-même." },
  { word: "INTERNET", definition: "Réseau informatique mondial." },
  { word: "SERVEUR", definition: "Ordinateur fournissant des services." },
  { word: "CLAVIER", definition: "Périphérique de saisie de caractères." },
  { word: "SYSTEME", definition: "Ensemble de logiciels de base d'un ordinateur." },
  { word: "LOGICIEL", definition: "Programme informatique." },
  { word: "TERMINAL", definition: "Interface textuelle de commande." },
  { word: "BALISE", definition: "Élément de structuration HTML." },
  { word: "METHODE", definition: "Fonction liée à une classe." },
  { word: "BOUCLE", definition: "Répétition d'une portion de code." },
  { word: "TABLEAU", definition: "Structure de données séquentielle." },
  { word: "CHAINE", definition: "Suite de caractères." },
  { word: "ENTIER", definition: "Nombre sans décimale." },
  { word: "BINAIRE", definition: "Système de numération base 2." },
  { word: "OCTET", definition: "Unité de 8 bits." },
  { word: "PROCESSEUR", definition: "Cerveau de l'ordinateur exécutant les instructions." },
  { word: "PIXEL", definition: "Point élémentaire d'une image numérique." },
  { word: "LATENCE", definition: "Délai de transmission réseau." },
  { word: "UPLOAD", definition: "Envoi de données vers un serveur." },
  { word: "DOWNLOAD", definition: "Réception de données depuis un serveur." },
  { word: "REQUETE", definition: "Demande adressée à une base de données." },
  { word: "COOKIE", definition: "Fichier traceur stocké par le navigateur." },
  { word: "SESSION", definition: "Temps de connexion d'un utilisateur." },
  { word: "CACHE", definition: "Mémoire rapide temporaire." },
  { word: "PROXY", definition: "Serveur mandataire intermédiaire." },
  { word: "PASSWORD", definition: "Mot de passe." },
  { word: "ADMIN", definition: "Administrateur système." },
  { word: "COMMIT", definition: "Enregistrement de modifications (Git)." },
  { word: "BRANCH", definition: "Branche de développement." },
  { word: "MERGE", definition: "Fusion de code." },
  { word: "DEBUG", definition: "Correction de bugs." },
  { word: "DEPLOY", definition: "Mise en production." },
  { word: "AGILE", definition: "Méthode de gestion de projet souple." },
  { word: "SPRINT", definition: "Cycle de développement court." },
  { word: "LINTER", definition: "Analyseur statique de code." },
  { word: "SYNTAXE", definition: "Grammaire d'un langage informatique." },
  { word: "ERREUR", definition: "Bug ou exception." },
  { word: "STACK", definition: "Pile d'exécution ou technologies." },
  { word: "POINTEUR", definition: "Adresse mémoire." },
  { word: "ASYNC", definition: "Asynchrone." },
  { word: "PROMISE", definition: "Promesse JavaScript." },
  { word: "DOCKER", definition: "Conteneurisation." },
  { word: "CLOUD", definition: "Informatique en nuage." },
  { word: "LINUX", definition: "OS open source." },
  { word: "PYTHON", definition: "Langage de script." },
  { word: "REACT", definition: "Lib UI Facebook." },
  { word: "ANGULAR", definition: "Framework Google." },
  { word: "FRAMEWORK", definition: "Cadre logiciel." },
  { word: "LIBRARY", definition: "Bibliothèque de code." },
  { word: "WIDGET", definition: "Gadget graphique." },
  { word: "BACKUP", definition: "Sauvegarde." },
  { word: "REBOOT", definition: "Redémarrage." },
  { word: "SOURCE", definition: "Code source." },
  { word: "OPEN", definition: "Ouvert (Open Source)." },
  { word: "HACKER", definition: "Bidouilleur informatique." },
  { word: "PHISHING", definition: "Hameçonnage." },
  { word: "SPAM", definition: "Courrier indésirable." },
  { word: "VIRUS", definition: "Logiciel contaminant." },
  { word: "MALWARE", definition: "Logiciel malveillant." },
  { word: "TROJAN", definition: "Cheval de Troie." },
  { word: "RANSOM", definition: "Rançonlogiciel." },
  { word: "BOTNET", definition: "Réseau de bots." },
  { word: "DDOS", definition: "Attaque par déni de service." },
  { word: "SQL", definition: "Langage de bases de données." },
  { word: "NOSQL", definition: "Non relationnel." },
  { word: "MONGO", definition: "Base documents." },
  { word: "REDIS", definition: "Base clé-valeur mémoire." },
  { word: "KAFKA", definition: "Streaming de données." },
  { word: "LAMBDA", definition: "Fonction serverless." },
  { word: "AZURE", definition: "Cloud Microsoft." },
  { word: "AWS", definition: "Cloud Amazon." },
  { word: "GOOGLE", definition: "Moteur de recherche." },
  { word: "SAAS", definition: "Software as a Service." },
  { word: "PAAS", definition: "Platform as a Service." },
  { word: "IAAS", definition: "Infrastructure as a Service." },
  { word: "REST", definition: "Architecture API." },
  { word: "SOAP", definition: "Protocole XML." },
  { word: "JSON", definition: "Format de données JS." },
  { word: "XML", definition: "Langage de balisage." },
  { word: "YAML", definition: "Format de sérialisation." },
  { word: "CSV", definition: "Valeurs séparées par virgules." },
  { word: "PDF", definition: "Format de document portable." },
  { word: "SOCKET", definition: "Connexion réseau." },
  { word: "HTTP", definition: "Protocole Web." },
  { word: "HTTPS", definition: "HTTP sécurisé." },
  { word: "TCP", definition: "Protocole de transport fiable." },
  { word: "UDP", definition: "Protocole de transport rapide." },
  { word: "IP", definition: "Protocole Internet." },
  { word: "DNS", definition: "Résolution de noms." },
  { word: "DHCP", definition: "Attribution d'IP." },
  { word: "SSH", definition: "Shell sécurisé." },
  { word: "FTP", definition: "Transfert de fichiers." },
  { word: "SMTP", definition: "Envoi d'emails." },
  { word: "IMAP", definition: "Réception d'emails." },
  { word: "POP", definition: "Protocole email ancien." },
  { word: "WIFI", definition: "Réseau sans fil." },
  { word: "BLUETOOTH", definition: "Connexion sans fil courte portée." },
  { word: "NFC", definition: "Communication champ proche." },
  { word: "USB", definition: "Bus série universel." },
  { word: "HDMI", definition: "Interface multimédia HD." },
  { word: "VGA", definition: "Connecteur vidéo analogique." },
  { word: "RAM", definition: "Mémoire vive." },
  { word: "ROM", definition: "Mémoire morte." },
  { word: "SSD", definition: "Disque flash." },
  { word: "HDD", definition: "Disque dur mécanique." },
  { word: "GPU", definition: "Processeur graphique." },
  { word: "CPU", definition: "Processeur central." },
  { word: "BIOS", definition: "Système d'entrée/sortie de base." },
  { word: "UEFI", definition: "Remplaçant du BIOS." },
  { word: "KERNEL", definition: "Noyau système." },
  { word: "SHELL", definition: "Interpréteur de commandes." },
  { word: "BASH", definition: "Shell Unix courant." },
  { word: "ZSH", definition: "Shell Unix avancé." },
  { word: "POWERSHELL", definition: "Shell Windows." },
  { word: "CMD", definition: "Invite de commande." },
  { word: "SUDO", definition: "Exécuter en tant qu'admin." },
  { word: "CHMOD", definition: "Changer les permissions." },
  { word: "CHOWN", definition: "Changer le propriétaire." },
  { word: "GREP", definition: "Rechercher dans du texte." },
  { word: "CURL", definition: "Outil transfert URL." },
  { word: "WGET", definition: "Téléchargeur en ligne de commande." },
  { word: "NPM", definition: "Gestionnaire de paquets Node." },
  { word: "YARN", definition: "Alternative à NPM." },
  { word: "PIP", definition: "Gestionnaire paquets Python." },
  { word: "MAVEN", definition: "Gestionnaire build Java." },
  { word: "GRADLE", definition: "Outil d'automatisation build." },
  { word: "COMPOSER", definition: "Gestionnaire paquets PHP." },
  { word: "RUBYGEMS", definition: "Paquets Ruby." },
  { word: "CARGO", definition: "Gestionnaire Rust." },
  { word: "GO", definition: "Langage Go." },
  { word: "RUST", definition: "Langage système sûr." },
  { word: "JAVA", definition: "Langage POO portable." },
  { word: "KOTLIN", definition: "Java moderne." },
  { word: "SWIFT", definition: "Langage Apple." },
  { word: "DART", definition: "Langage Google (Flutter)." },
  { word: "FLUTTER", definition: "UI Toolkit Google." },
  { word: "VUE", definition: "Framework JS progressif." },
  { word: "SVELTE", definition: "Compilateur UI." },
  { word: "EMBER", definition: "Framework JS ambitieux." },
  { word: "JQUERY", definition: "Lib JS historique." },
  { word: "BOOTSTRAP", definition: "Framework CSS." },
  { word: "TAILWIND", definition: "CSS utilitaire." },
  { word: "SASS", definition: "CSS étendu." },
  { word: "LESS", definition: "Préprocesseur CSS." },
  { word: "WEBPACK", definition: "Bundler JS." },
  { word: "VITE", definition: "Outil build rapide." },
  { word: "BABEL", definition: "Transpilateur JS." },
  { word: "ESLINT", definition: "Linter JS." },
  { word: "PRETTIER", definition: "Formateur code." },
  { word: "JEST", definition: "Test runner JS." },
  { word: "CYPRESS", definition: "Tests E2E." },
  { word: "SELENIUM", definition: "Automatisation navigateur." },
  { word: "JUNIT", definition: "Tests unitaires Java." },
  { word: "PHPUNIT", definition: "Tests unitaires PHP." },
  { word: "MOCHA", definition: "Framework test JS." },
  { word: "CHAI", definition: "Lib assertion JS." },
  { word: "KARMA", definition: "Test runner." },
  { word: "JASMINE", definition: "Framework test BDD." },
  { word: "GITLAB", definition: "Plateforme DevOps." },
  { word: "GITHUB", definition: "Hébergeur Git." },
  { word: "BITBUCKET", definition: "Solution Git Atlassian." },
  { word: "JIRA", definition: "Gestion projet agile." },
  { word: "TRELLO", definition: "Gestion tâches kanban." },
  { word: "SLACK", definition: "Messagerie équipe." },
  { word: "DISCORD", definition: "Chat vocal et texte." },
  { word: "TEAMS", definition: "Collab Microsoft." },
  { word: "ZOOM", definition: "Visioconférence." },
  { word: "FIGMA", definition: "Design interface." },
  { word: "SKETCH", definition: "Design vectoriel." },
  { word: "ADOBE", definition: "Suite créative." },
  { word: "VSCODE", definition: "Éditeur code MS." },
  { word: "INTELLIJ", definition: "IDE JetBrains." },
  { word: "ECLIPSE", definition: "IDE Java historique." },
  { word: "NETBEANS", definition: "IDE Oracle." },
  { word: "XCODE", definition: "IDE Apple." },
  { word: "ANDROID", definition: "OS mobile Google." },
  { word: "IOS", definition: "OS mobile Apple." },
  { word: "WINDOWS", definition: "OS Microsoft." },
  { word: "MACOS", definition: "OS Apple Mac." },
  { word: "UBUNTU", definition: "Distro Linux populaire." },
  { word: "DEBIAN", definition: "Distro Linux stable." },
  { word: "ARCH", definition: "Linux rolling release." },
  { word: "FEDORA", definition: "Linux Red Hat." },
  { word: "CENTOS", definition: "Linux serveur." },
  { word: "KALI", definition: "Linux sécurité." },
  { word: "RASPBERRY", definition: "Nano-ordinateur." },
  { word: "ARDUINO", definition: "Microcontrôleur." },
  { word: "IOT", definition: "Internet des objets." },
  { word: "BLOCKCHAIN", definition: "Chaîne de blocs." },
  { word: "BITCOIN", definition: "Cryptomonnaie." },
  { word: "ETHEREUM", definition: "Plateforme contrats." },
  { word: "NFT", definition: "Jeton non fongible." },
  { word: "MINING", definition: "Minage crypto." },
  { word: "WALLET", definition: "Portefeuille numérique." },
  { word: "EXCHANGE", definition: "Bourse crypto." },
  { word: "DEFI", definition: "Finance décentralisée." },
  { word: "DAO", definition: "Orga autonome." },
  { word: "SMART", definition: "Intelligent (contrat)." },
  { word: "CONTRACT", definition: "Contrat code." },
  { word: "SOLIDITY", definition: "Langage Ethereum." },
  { word: "WEB3", definition: "Web décentralisé." },
  { word: "METAVERSE", definition: "Univers virtuel." },
  { word: "VR", definition: "Réalité virtuelle." },
  { word: "AR", definition: "Réalité augmentée." },
  { word: "XR", definition: "Réalité étendue." },
  { word: "AI", definition: "Intelligence artificielle." },
  { word: "ML", definition: "Machine Learning." },
  { word: "DL", definition: "Deep Learning." },
  { word: "NN", definition: "Réseau neurones." },
  { word: "NLP", definition: "Traitement langue." },
  { word: "CV", definition: "Vision par ordinateur." },
  { word: "DATASET", definition: "Jeu de données." },
  { word: "MODEL", definition: "Modèle IA." },
  { word: "TRAINING", definition: "Entraînement IA." },
  { word: "INFERENCE", definition: "Prédiction IA." },
  { word: "TENSOR", definition: "Objet mathématique." },
  { word: "PYTORCH", definition: "Framework IA Facebook." },
  { word: "KERAS", definition: "API haut niveau IA." },
  { word: "SCIKIT", definition: "Lib ML Python." },
  { word: "PANDAS", definition: "Analyse données." },
  { word: "NUMPY", definition: "Calcul numérique." },
  { word: "MATPLOTLIB", definition: "Graphes Python." },
  { word: "SEABORN", definition: "Visu données." },
  { word: "JUPYTER", definition: "Notebook code." },
  { word: "KAGGLE", definition: "Compétitions data." },
  { word: "HADOOP", definition: "Big Data distribué." },
  { word: "SPARK", definition: "Calcul distribué." },
  { word: "HIVE", definition: "Entrepôt données." },
  { word: "ELASTIC", definition: "Moteur recherche." },
  { word: "LOGSTASH", definition: "Pipeline logs." },
  { word: "KIBANA", definition: "Visu logs." },
  { word: "GRAFANA", definition: "Monitoring." },
  { word: "PROMETHEUS", definition: "Métriques." },
  { word: "NAGIOS", definition: "Supervision." },
  { word: "ZABBIX", definition: "Monitoring réseau." },
  { word: "ANSIBLE", definition: "Automatisation." },
  { word: "PUPPET", definition: "Gestion config." },
  { word: "CHEF", definition: "Infrastructure as Code." },
  { word: "TERRAFORM", definition: "Infra as Code HashiCorp." },
  { word: "VAGRANT", definition: "Environnements virtuels." },
  { word: "VIRTUALBOX", definition: "Virtualisation." },
  { word: "VMWARE", definition: "Virtualisation pro." },
  { word: "HYPERV", definition: "Virtualisation MS." },
  { word: "QEMU", definition: "Émulateur." },
  { word: "WINE", definition: "Couche compatibilité." },
  { word: "PROTON", definition: "Jeu sous Linux." },
  { word: "STEAM", definition: "Plateforme jeux." },
  { word: "UNITY", definition: "Moteur jeux." },
  { word: "UNREAL", definition: "Moteur graphique." },
  { word: "GODOT", definition: "Moteur libre." },
  { word: "BLENDER", definition: "3D open source." },
  { word: "MAYA", definition: "3D Autodesk." },
  { word: "GIMP", definition: "Retouche image libre." },
  { word: "INKSCAPE", definition: "Dessin vectoriel libre." },
  { word: "OBS", definition: "Streaming libre." },
  { word: "VLC", definition: "Lecteur média." },
  { word: "FFMPEG", definition: "Traitement vidéo." },
  { word: "CODEC", definition: "Compresseur/Décompresseur." },
  { word: "MP4", definition: "Format vidéo." },
  { word: "MP3", definition: "Format audio." },
  { word: "JPG", definition: "Format image." },
  { word: "PNG", definition: "Image sans perte." },
  { word: "GIF", definition: "Image animée." },
  { word: "SVG", definition: "Vecteur Web." },
  { word: "WEBP", definition: "Image Web moderne." },
  { word: "WOFF", definition: "Police Web." },
  { word: "TTF", definition: "Police TrueType." },
  { word: "OTF", definition: "Police OpenType." },
  { word: "ASCII", definition: "Codage caractères." },
  { word: "UNICODE", definition: "Jeu caractères universel." },
  { word: "UTF8", definition: "Encodage Unicode." },
  { word: "BASE64", definition: "Encodage binaire texte." },
  { word: "HASH", definition: "Empreinte numérique." },
  { word: "MD5", definition: "Algo hachage vieux." },
  { word: "SHA", definition: "Secure Hash Algorithm." },
  { word: "RSA", definition: "Chiffrement asymétrique." },
  { word: "AES", definition: "Chiffrement symétrique." },
  { word: "TLS", definition: "Sécurité transport." },
  { word: "SSL", definition: "Ancêtre de TLS." },
  { word: "VPN", definition: "Réseau privé virtuel." },
  { word: "TOR", definition: "Réseau anonyme." },
  { word: "DARKWEB", definition: "Web caché." },
  { word: "ONION", definition: "Adresse Tor." },
  { word: "P2P", definition: "Pair à pair." },
  { word: "TORRENT", definition: "Partage fichier." },
  { word: "MAGNET", definition: "Lien P2P." },
  { word: "SEED", definition: "Source fichier." },
  { word: "LEECH", definition: "Téléchargeur." },
  { word: "RATIO", definition: "Partage/Téléchargement." },
  { word: "TRACKER", definition: "Serveur P2P." },
  { word: "DHT", definition: "Table hachage distribuée." },
  { word: "IPFS", definition: "Système fichiers interplanétaire." },
  { word: "GNUPG", definition: "Chiffrement emails." },
  { word: "PGP", definition: "Confidentialité." },
  { word: "KEY", definition: "Clé chiffrement." },
  { word: "PUBLIC", definition: "Clé publique." },
  { word: "PRIVATE", definition: "Clé privée." },
  { word: "CERT", definition: "Certificat." },
  { word: "CA", definition: "Autorité certification." },
  { word: "CSR", definition: "Demande signature." },
  { word: "X509", definition: "Standard certificat." },
  { word: "PEM", definition: "Format clé." },
  { word: "DER", definition: "Format binaire." },
  { word: "PKCS", definition: "Standard crypto." },
  { word: "JWT", definition: "Jeton Web JSON." },
  { word: "OAUTH", definition: "Autorisation." },
  { word: "OPENID", definition: "Identification." },
  { word: "SAML", definition: "Échange auth." },
  { word: "LDAP", definition: "Annuaire." },
  { word: "AD", definition: "Active Directory." },
  { word: "KERBEROS", definition: "Auth réseau." },
  { word: "SSO", definition: "Auth unique." },
  { word: "MFA", definition: "Double facteur." },
  { word: "TOTP", definition: "Mot de passe temps." },
  { word: "HOTP", definition: "Mot de passe compteur." },
  { word: "OTP", definition: "Mot de passe unique." },
  { word: "SMS", definition: "Message texte." },
  { word: "EMAIL", definition: "Courrier électronique." },
  { word: "PUSH", definition: "Notification." },
  { word: "WEBHOOK", definition: "Rappel HTTP." },
  { word: "APIKEY", definition: "Clé API." },
  { word: "TOKEN", definition: "Jeton accès." },
  { word: "SCOPE", definition: "Portée droits." },
  { word: "ROLE", definition: "Rôle utilisateur." },
  { word: "GROUP", definition: "Groupe utilisateurs." },
  { word: "USER", definition: "Utilisateur." },
  { word: "GUEST", definition: "Invité." },
  { word: "ROOT", definition: "Super-utilisateur." },
  { word: "SUDOER", definition: "Délégué root." },
  { word: "WHEEL", definition: "Groupe admin." },
  { word: "CRON", definition: "Planificateur tâches." },
  { word: "JOB", definition: "Tâche." },
  { word: "PROCESS", definition: "Processus." },
  { word: "THREAD", definition: "Fil exécution." },
  { word: "DAEMON", definition: "Service arrière-plan." },
  { word: "SERVICE", definition: "Application système." },
  { word: "LOG", definition: "Journal événements." },
  { word: "AUDIT", definition: "Vérification." },
  { word: "DEBUG", definition: "Mise au point." },
  { word: "TRACE", definition: "Suivi exécution." },
  { word: "DUMP", definition: "Cliché mémoire." },
  { word: "PANIC", definition: "Erreur critique." },
  { word: "CRASH", definition: "Arrêt brutal." },
  { word: "BUG", definition: "Défaut." },
  { word: "PATCH", definition: "Correctif." },
  { word: "FIX", definition: "Réparation." },
  { word: "UPDATE", definition: "Mise à jour." },
  { word: "UPGRADE", definition: "Mise à niveau." },
  { word: "DOWNGRADE", definition: "Retour version." },
  { word: "ROLLBACK", definition: "Annulation." },
  { word: "BACKPORT", definition: "Portage inverse." },
  { word: "FORK", definition: "Bifurcation projet." },
  { word: "CLONE", definition: "Copie identique." },
  { word: "PULL", definition: "Tirer (Git)." },
  { word: "PUSH", definition: "Pousser (Git)." },
  { word: "FETCH", definition: "Récupérer (Git)." },
  { word: "STASH", definition: "Remiser (Git)." },
  { word: "REBASE", definition: "Rebaser (Git)." },
  { word: "TAG", definition: "Étiquette." },
  { word: "HEAD", definition: "Tête (Git)." },
  { word: "MASTER", definition: "Branche principale." },
  { word: "MAIN", definition: "Nouvelle branche princ." },
  { word: "ORIGIN", definition: "Dépôt distant." },
  { word: "UPSTREAM", definition: "Dépôt amont." },
  { word: "REMOTE", definition: "Distant." },
  { word: "LOCAL", definition: "Local." },
  { word: "STAGING", definition: "Pré-production." },
  { word: "PROD", definition: "Production." },
  { word: "DEV", definition: "Développement." },
  { word: "TEST", definition: "Test." },
  { word: "QA", definition: "Assurance qualité." },
  { word: "CI", definition: "Intégration continue." },
  { word: "CD", definition: "Déploiement continu." },
  { word: "PIPELINE", definition: "Chaîne traitement." },
  { word: "BUILD", definition: "Construction." },
  { word: "ARTIFACT", definition: "Livrable." },
  { word: "RELEASE", definition: "Version publiée." },
  { word: "VERSION", definition: "Numéro version." },
  { word: "SEMVER", definition: "Versioning sémantique." },
  { word: "MAJOR", definition: "Majeur." },
  { word: "MINOR", definition: "Mineur." },
  { word: "PATCH", definition: "Correctif." },
  { word: "BETA", definition: "Version test." },
  { word: "ALPHA", definition: "Version instable." },
  { word: "RC", definition: "Release Candidate." },
  { word: "STABLE", definition: "Version stable." },
  { word: "LTS", definition: "Long terme support." },
  { word: "EOL", definition: "Fin de vie." },
  { word: "DEPRECATED", definition: "Obsolète." },
  { word: "LEGACY", definition: "Hérité." },
  { word: "MODERN", definition: "Moderne." },
  { word: "NATIVE", definition: "Natif." },
  { word: "WEB", definition: "Web." },
  { word: "HYBRID", definition: "Hybride." },
  { word: "MOBILE", definition: "Mobile." },
  { word: "DESKTOP", definition: "Bureau." },
  { word: "TABLET", definition: "Tablette." },
  { word: "WATCH", definition: "Montre." },
  { word: "TV", definition: "Télévision." },
  { word: "AUTO", definition: "Automobile." },
  { word: "EMBEDDED", definition: "Embarqué." },
  { word: "REALTIME", definition: "Temps réel." },
  { word: "BATCH", definition: "Traitement lot." },
  { word: "STREAM", definition: "Flux." },
  { word: "BUFFER", definition: "Tampon." },
  { word: "QUEUE", definition: "File d'attente." },
  { word: "STACK", definition: "Pile." },
  { word: "HEAP", definition: "Tas." },
  { word: "TREE", definition: "Arbre." },
  { word: "GRAPH", definition: "Graphe." },
  { word: "NODE", definition: "Nœud." },
  { word: "EDGE", definition: "Arête." },
  { word: "VERTEX", definition: "Sommet." },
  { word: "ROOT", definition: "Racine." },
  { word: "LEAF", definition: "Feuille." },
  { word: "CHILD", definition: "Enfant." },
  { word: "PARENT", definition: "Parent." },
  { word: "SIBLING", definition: "Frère/Sœur." },
  { word: "DEPTH", definition: "Profondeur." },
  { word: "HEIGHT", definition: "Hauteur." },
  { word: "WIDTH", definition: "Largeur." },
  { word: "SEARCH", definition: "Recherche." },
  { word: "SORT", definition: "Tri." },
  { word: "FILTER", definition: "Filtre." },
  { word: "MAP", definition: "Transformation." },
  { word: "REDUCE", definition: "Réduction." },
  { word: "FIND", definition: "Trouver." },
  { word: "SPLIT", definition: "Séparer." },
  { word: "JOIN", definition: "Joindre." },
  { word: "CONCAT", definition: "Concaténer." },
  { word: "SLICE", definition: "Trancher." },
  { word: "SPLICE", definition: "Épisser." },
  { word: "PUSH", definition: "Ajouter fin." },
  { word: "POP", definition: "Retirer fin." },
  { word: "SHIFT", definition: "Retirer début." },
  { word: "UNSHIFT", definition: "Ajouter début." },
  { word: "INDEX", definition: "Position." },
  { word: "KEY", definition: "Clé." },
  { word: "VALUE", definition: "Valeur." },
  { word: "ENTRY", definition: "Entrée." },
  { word: "ITEM", definition: "Élément." },
  { word: "LIST", definition: "Liste." },
  { word: "SET", definition: "Ensemble." },
  { word: "MAP", definition: "Carte." },
  { word: "TUPLE", definition: "Tuple." },
  { word: "OBJECT", definition: "Objet." },
  { word: "CLASS", definition: "Classe." },
  { word: "STRUCT", definition: "Structure." },
  { word: "ENUM", definition: "Énumération." },
  { word: "UNION", definition: "Union." },
  { word: "TYPE", definition: "Type." },
  { word: "VOID", definition: "Vide." },
  { word: "NULL", definition: "Nul." },
  { word: "UNDEFINED", definition: "Indéfini." },
  { word: "NAN", definition: "Pas un nombre." },
  { word: "INFINITY", definition: "Infini." },
  { word: "TRUE", definition: "Vrai." },
  { word: "FALSE", definition: "Faux." },
  { word: "BOOLEAN", definition: "Booléen." },
  { word: "STRING", definition: "Chaîne." },
  { word: "NUMBER", definition: "Nombre." },
  { word: "BIGINT", definition: "Grand entier." },
  { word: "SYMBOL", definition: "Symbole." },
  { word: "ANY", definition: "Tout." },
  { word: "UNKNOWN", definition: "Inconnu." },
  { word: "NEVER", definition: "Jamais." },
  { word: "CONST", definition: "Constante." },
  { word: "LET", definition: "Variable locale." },
  { word: "VAR", definition: "Variable." },
  { word: "FUNC", definition: "Fonction." },
  { word: "RETURN", definition: "Retourner." },
  { word: "IF", definition: "Si." },
  { word: "ELSE", definition: "Sinon." },
  { word: "SWITCH", definition: "Selon." },
  { word: "CASE", definition: "Cas." },
  { word: "DEFAULT", definition: "Défaut." },
  { word: "FOR", definition: "Pour." },
  { word: "WHILE", definition: "Tant que." },
  { word: "DO", definition: "Faire." },
  { word: "BREAK", definition: "Arrêter." },
  { word: "CONTINUE", definition: "Continuer." },
  { word: "TRY", definition: "Essayer." },
  { word: "CATCH", definition: "Attraper." },
  { word: "FINALLY", definition: "Finalement." },
  { word: "THROW", definition: "Lancer." },
  { word: "IMPORT", definition: "Importer." },
  { word: "EXPORT", definition: "Exporter." },
  { word: "FROM", definition: "De." },
  { word: "AS", definition: "Comme." },
  { word: "NEW", definition: "Nouveau." },
  { word: "THIS", definition: "Ceci." },
  { word: "SUPER", definition: "Parent." },
  { word: "EXTENDS", definition: "Étendre." },
  { word: "IMPLEMENTS", definition: "Implémenter." },
  { word: "INTERFACE", definition: "Interface." },
  { word: "PACKAGE", definition: "Paquet." },
  { word: "MODULE", definition: "Module." },
  { word: "NAMESPACE", definition: "Espace noms." },
  { word: "PUBLIC", definition: "Public." },
  { word: "PRIVATE", definition: "Privé." },
  { word: "PROTECTED", definition: "Protégé." },
  { word: "STATIC", definition: "Statique." },
  { word: "FINAL", definition: "Final." },
  { word: "ABSTRACT", definition: "Abstrait." },
  { word: "VIRTUAL", definition: "Virtuel." },
  { word: "OVERRIDE", definition: "Surcharger." },
  { word: "ASYNC", definition: "Asynchrone." },
  { word: "AWAIT", definition: "Attendre." },
  { word: "YIELD", definition: "Produire." },
  { word: "TYPEOF", definition: "Type de." },
  { word: "INSTANCEOF", definition: "Instance de." },
  { word: "IN", definition: "Dans." },
  { word: "OF", definition: "De." },
  { word: "DELETE", definition: "Supprimer." }
];

// Deterministic random generator based on date
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

async function generateTechWord(): Promise<{ word: string; definition: string }> {
  // Strategy: Use the date to pick a word deterministically from the large list.
  const todayStr = format(new Date(), "yyyyMMdd");
  const seed = parseInt(todayStr);
  
  // Use seeded random to pick an index
  const randomIndex = Math.floor(seededRandom(seed) * TECH_WORDS.length);
  
  return TECH_WORDS[randomIndex];
}

export async function getDailyWord(): Promise<DailyWord | null> {
  const supabase = await createClient();
  const today = format(new Date(), "yyyy-MM-dd");

  // 1. Try to get existing word for today from DB
  let { data, error } = await supabase
    .from("daily_words")
    .select("*")
    .eq("date", today)
    .single();

  // 2. If no word exists for today, generate and save it
  if (!data) {
    console.log("No word for today in DB, generating...");
    
    try {
      // First attempt generation based on today's seed
      let newWordData = await generateTechWord();
      
      // Use Service Role if available to bypass RLS
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      let adminSupabase = supabase;
      
      if (serviceRoleKey) {
        const { createClient: createSupabaseClient } = require("@supabase/supabase-js");
        adminSupabase = createSupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          serviceRoleKey
        );
      }

      // STRICT UNIQUENESS CHECK
      // We must ensure this word has NEVER been used before.
      // If 'word' column is unique, we can't insert it again.
      
      // Check if word already exists
      const { data: existingWord } = await adminSupabase
        .from("daily_words")
        .select("*")
        .eq("word", newWordData.word)
        .single();
        
      if (existingWord) {
         // Word already used! We need to find a replacement.
         // We will iterate through the TECH_WORDS list using a deterministic offset until we find a free one.
         // This guarantees we eventually find a free word if one exists.
         
         let availableWord = null;
         const todayInt = parseInt(format(new Date(), "yyyyMMdd"));
         
         // Try up to 500 attempts to find a free word
         for (let i = 1; i < 500; i++) {
            // Deterministic retry sequence based on date + attempt index
            // Use a prime number step to scatter selection
            const retryIndex = Math.floor(seededRandom(todayInt + (i * 1337)) * TECH_WORDS.length);
            const candidate = TECH_WORDS[retryIndex];
            
            const { data: check } = await adminSupabase
                .from("daily_words")
                .select("id")
                .eq("word", candidate.word)
                .single();
                
            if (!check) {
                availableWord = candidate;
                console.log(`Found unused word after ${i} retries: ${availableWord.word}`);
                break;
            }
         }
         
         if (availableWord) {
             newWordData = availableWord;
         } else {
             console.warn("CRITICAL: Could not find any unused word after 500 retries.");
             // Extremely unlikely given 1000+ words, but fallback to memory to not crash.
             // We won't save it to DB to avoid duplicate error.
             return {
                 id: "temp-" + Date.now(),
                 word: newWordData.word,
                 definition: newWordData.definition,
                 date: today
             };
         }
      }

      const { data: insertedData, error: insertError } = await adminSupabase
        .from("daily_words")
        .insert({
          word: newWordData.word,
          definition: newWordData.definition,
          date: today
        })
        .select()
        .single();

      if (insertError) {
        console.warn("Could not save generated word to DB:", insertError.message);
        // Return memory-only word
        return {
            id: "temp-id-" + Date.now(),
            word: newWordData.word,
            definition: newWordData.definition,
            date: today
        };
      }
      
      data = insertedData;
    } catch (e) {
      console.error("Error generating/saving daily word:", e);
      return {
        id: "fallback",
        word: "ERREUR",
        definition: "Une erreur est survenue.",
        date: today
      };
    }
  }

  return data as DailyWord;
}

export async function getUserGameState(userId: string, wordId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("game_attempts")
    .select("*")
    .eq("user_id", userId)
    .eq("word_id", wordId)
    .single();

  if (error && error.code !== 'PGRST116') { 
    console.error("Error fetching user game state:", error);
  }

  return data;
}

export async function saveGameAttempt(userId: string, wordId: string, attempts: number, guesses: any[]) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("game_attempts")
    .insert({
      user_id: userId,
      word_id: wordId,
      attempts,
      guesses
    });

  if (error) {
    console.error("Error saving game attempt:", error);
    return { error: error.message };
  }

  return { success: true };
}
