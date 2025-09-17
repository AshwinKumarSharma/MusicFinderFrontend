import { Track, VibeProfile } from './types';

// Define genre mappings for better vibe analysis
const GENRE_ENERGY_MAP: Record<string, { energy: 'low' | 'medium' | 'high'; mood: string; tempo: 'slow' | 'medium' | 'fast' }> = {
  // Electronic & Dance
  'Electronic': { energy: 'high', mood: 'energetic', tempo: 'fast' },
  'Dance': { energy: 'high', mood: 'party', tempo: 'fast' },
  'House': { energy: 'high', mood: 'party', tempo: 'fast' },
  'Techno': { energy: 'high', mood: 'energetic', tempo: 'fast' },
  'Trance': { energy: 'high', mood: 'energetic', tempo: 'fast' },
  'Dubstep': { energy: 'high', mood: 'energetic', tempo: 'fast' },
  
  // Hip Hop & Rap
  'Hip-Hop/Rap': { energy: 'high', mood: 'energetic', tempo: 'medium' },
  'Rap': { energy: 'high', mood: 'energetic', tempo: 'medium' },
  
  // Pop & Rock
  'Pop': { energy: 'medium', mood: 'happy', tempo: 'medium' },
  'Rock': { energy: 'high', mood: 'energetic', tempo: 'fast' },
  'Alternative': { energy: 'medium', mood: 'energetic', tempo: 'medium' },
  'Indie Rock': { energy: 'medium', mood: 'chill', tempo: 'medium' },
  
  // R&B & Soul
  'R&B/Soul': { energy: 'medium', mood: 'relaxed', tempo: 'medium' },
  'Soul': { energy: 'medium', mood: 'relaxed', tempo: 'medium' },
  
  // Jazz & Blues
  'Jazz': { energy: 'low', mood: 'chill', tempo: 'slow' },
  'Blues': { energy: 'low', mood: 'sad', tempo: 'slow' },
  
  // Classical & Instrumental
  'Classical': { energy: 'low', mood: 'relaxed', tempo: 'slow' },
  'Instrumental': { energy: 'low', mood: 'chill', tempo: 'slow' },
  
  // Country & Folk
  'Country': { energy: 'medium', mood: 'happy', tempo: 'medium' },
  'Folk': { energy: 'low', mood: 'relaxed', tempo: 'slow' },
  
  // Ambient & Chill
  'Ambient': { energy: 'low', mood: 'chill', tempo: 'slow' },
  'Chillout': { energy: 'low', mood: 'chill', tempo: 'slow' },
  'Downtempo': { energy: 'low', mood: 'chill', tempo: 'slow' },
  
  // Latin & World
  'Latin': { energy: 'high', mood: 'party', tempo: 'fast' },
  'Reggae': { energy: 'medium', mood: 'chill', tempo: 'slow' },
  'Reggaeton': { energy: 'high', mood: 'party', tempo: 'fast' },
};

// Keywords for energy detection
const HIGH_ENERGY_KEYWORDS = ['party', 'dance', 'club', 'remix', 'beat', 'pump', 'energy', 'electric', 'power'];
const LOW_ENERGY_KEYWORDS = ['acoustic', 'slow', 'ballad', 'soft', 'gentle', 'quiet', 'calm', 'peaceful'];

// Keywords for mood detection
const HAPPY_KEYWORDS = ['happy', 'love', 'good', 'sunshine', 'smile', 'celebrate', 'joy', 'fun'];
const SAD_KEYWORDS = ['sad', 'cry', 'alone', 'broken', 'hurt', 'miss', 'goodbye', 'tears'];
const PARTY_KEYWORDS = ['party', 'club', 'dance', 'tonight', 'wild', 'crazy', 'celebration'];
const CHILL_KEYWORDS = ['chill', 'relax', 'easy', 'smooth', 'mellow', 'laid-back', 'calm'];

// Film industry detection patterns
const FILM_INDUSTRY_PATTERNS = {
  bollywood: {
    keywords: ['bollywood', 'hindi film', 'hindi cinema', 'mumbai film', 'indian film', 'filmi', 'playback'],
    artistPatterns: /\b(lata|mangeshkar|asha|bhosle|kishore|kumar|mohammed|rafi|mukesh|jagjit|singh|hariharan|udit|narayan|alka|yagnik|kumar|sanu|abhijeet|kavita|krishnamurthy|sadhana|sargam|anuradha|paudwal|shreya|ghoshal|sunidhi|chauhan|rahat|fateh|ali|khan|arijit|singh|armaan|malik|asees|kaur|dhvani|bhanushali|jubin|nautiyal|darshan|raval|neha|kakkar|kailash|kher|shaan|sonu|nigam|k\.k|mohit|chauhan|mika|singh|honey|singh|yo|yo|badshah|raftaar|divine|nucleya)\b/i,
    genrePatterns: /bollywood|filmi|hindi|desi|indian/i
  },
  hollywood: {
    keywords: ['hollywood', 'american film', 'us cinema', 'movie soundtrack', 'film score', 'original soundtrack'],
    artistPatterns: /\b(john|williams|hans|zimmer|danny|elfman|alan|silvestri|james|horner|howard|shore|thomas|newman|michael|giacchino|alexandre|desplat|trent|reznor|atticus|ross|ludwig|göransson|hildur|guðnadóttir|justin|hurwitz|nicholas|britell|jonny|greenwood|mica|levi|ramin|djawadi|bear|mccreary|clint|mansell|cliff|martinez|carter|burwell|elliot|goldenthal|mark|mothersbaugh|patrick|doyle|rachel|portman|gabriel|yared|dario|marianelli|alberto|iglesias|gustavo|santaolalla|ennio|morricone)\b/i,
    genrePatterns: /soundtrack|score|theme|film|movie|original/i
  },
  tollywood: {
    keywords: ['tollywood', 'telugu film', 'telugu cinema', 'hyderabad film', 'andhra film', 'telangana film'],
    artistPatterns: /\b(s\.p\.balasubrahmanyam|k\.j\.yesudas|p\.susheela|s\.janaki|ghantasala|m\.m\.keeravani|a\.r\.rahman|ilaiyaraaja|devi|sri|prasad|thaman|s|mickey|j|meyer|anup|rubens|gopi|sundar|manisharma|vandemataram|srinivas|sai|karthik|shreya|ghoshal|kk|udit|narayan|hariharan|shankar|mahadevan|chithra|k\.s|sunitha|mallikarjun|tippu|rahul|nandkumar|ranjith|malavika|hemachandra|ramya|behera|sid|sriram|anurag|kulkarni|armaan|malik|asees|kaur|dhvani|bhanushali)\b/i,
    genrePatterns: /tollywood|telugu|andhra|telangana/i
  },
  kollywood: {
    keywords: ['kollywood', 'tamil film', 'tamil cinema', 'chennai film', 'tamilnadu film'],
    artistPatterns: /\b(a\.r\.rahman|ilaiyaraaja|m\.s\.subbulakshmi|t\.m\.soundararajan|p\.susheela|s\.janaki|k\.j\.yesudas|s\.p\.balasubrahmanyam|hariharan|k\.s\.chithra|unni|krishnan|shankar|mahadevan|bombay|jayashri|anirudh|ravichander|harris|jayaraj|yuvan|shankar|raja|d\.imman|gv|prakash|kumar|santhosh|narayanan|sid|sriram|chinmayi|shreya|ghoshal|karthik|haricharan|naresh|iyer|vijay|yesudas|madhu|balakrishnan|tippu|krish|benny|dayal)\b/i,
    genrePatterns: /kollywood|tamil|chennai|tamilnadu/i
  },
  mollywood: {
    keywords: ['mollywood', 'malayalam film', 'malayalam cinema', 'kerala film'],
    artistPatterns: /\b(k\.j\.yesudas|s\.janaki|p\.susheela|m\.g\.sreekumar|k\.s\.chithra|sujatha|mohan|vani|jairam|m\.s\.baburaj|devarajan|johnson|vidyasagar|ilaiyaraaja|ouseppachan|m\.jayachandran|deepak|dev|gopi|sundar|shaan|rahman|bijibal|prashant|pillai|rahul|raj|rex|vijayan|jakes|bejoy|sushin|shyam|ravi|g|venugopal|hariharan|unni|krishnan|srinivas|vijay|yesudas|madhu|balakrishnan|manjari|swetha|mohan|rimi|tomy|afsal|najim|arshad|franco|vineeth|sreenivasan)\b/i,
    genrePatterns: /mollywood|malayalam|kerala/i
  },
  sandalwood: {
    keywords: ['sandalwood', 'kannada film', 'kannada cinema', 'karnataka film', 'bangalore film'],
    artistPatterns: /\b(p\.b\.sreenivas|s\.janaki|vani|jairam|b\.r\.chaya|l\.r\.eswari|k\.j\.yesudas|s\.p\.balasubrahmanyam|p\.susheela|k\.s\.chithra|hariharan|unni|krishnan|srinivas|tippu|rajesh|krishnan|vijay|prakash|kunal|ganjawala|kailash|kher|shreya|ghoshal|udit|narayan|hamsalekha|v\.manohar|rajan|nagendra|upendra|kumar|arjun|janya|jessie|gift|anoop|seelin|armaan|malik|shashank|khaitan)\b/i,
    genrePatterns: /sandalwood|kannada|karnataka|bangalore/i
  },
  punjabi_cinema: {
    keywords: ['punjabi film', 'punjabi cinema', 'punjwood', 'pollywood'],
    artistPatterns: /\b(gurdas|maan|diljit|dosanjh|sidhu|moose|wala|karan|aujla|ammy|virk|ninja|kulwinder|billa|amrit|mann|jasmine|sandlas|sunanda|sharma|miss|pooja|yo|yo|honey|singh|badshah|nucleya|divine|ikka|raftaar|kr|dollar|kaur|ranjit|bawa|hans|raj|hans|sardool|sikandar|harbhajan|mann|manmohan|waris|nusrat|fateh|ali|khan|rahat|fateh|ali|khan)\b/i,
    genrePatterns: /punjabi|pollywood|punjwood|bhangra/i
  },
  bhojpuri: {
    keywords: ['bhojpuri film', 'bhojpuri cinema', 'bihar film', 'up film'],
    artistPatterns: /\b(manoj|tiwari|dinesh|lal|yadav|khesari|lal|yadav|pawan|singh|ravi|kishan|gunjan|singh|kalpana|patowary|indu|sonali|malvika|sharma|akshara|singh|shubhi|sharma|priyanka|singh|rajnish|mishra|sadhana|sargam|udit|narayan|kailash|kher|rahat|fateh|ali|khan|shreya|ghoshal)\b/i,
    genrePatterns: /bhojpuri|bihar|eastern/i
  },
  marathi_cinema: {
    keywords: ['marathi film', 'marathi cinema', 'maharashtra film', 'mumbai marathi'],
    artistPatterns: /\b(lata|mangeshkar|asha|bhosle|usha|mangeshkar|hridaynath|mangeshkar|pandit|jasraj|kishori|amonkar|shobha|gurtu|suresh|wadkar|mahesh|kale|ajay|atul|shankar|mahadevan|swapnil|bandodkar|vaishali|samant|kaushal|inamdar|bela|shende|rohit|raut|anand|shinde|avdhoot|gupte|shreya|ghoshal|adarsh|shinde|jasraj|joshi)\b/i,
    genrePatterns: /marathi|maharashtra|lavani/i
  },
  international: {
    keywords: ['international', 'global', 'world music', 'crossover', 'fusion'],
    artistPatterns: /\b(adele|taylor|swift|ed|sheeran|bruno|mars|drake|ariana|grande|billie|eilish|post|malone|dua|lipa|the|weeknd|justin|bieber|selena|gomez|rihanna|beyonce|lady|gaga|katy|perry|shawn|mendes|camila|cabello|charlie|puth|john|legend|alicia|keys|usher|chris|brown|jason|derulo|maroon|5|onerepublic|imagine|dragons|coldplay|twenty|one|pilots|panic|at|the|disco|fall|out|boy|my|chemical|romance|green|day)\b/i,
    genrePatterns: /pop|rock|hip.hop|r&b|electronic|dance|indie|alternative/i
  }
};

// Language detection patterns
const LANGUAGE_PATTERNS = {
  hindi: {
    keywords: ['hindi', 'bollywood', 'desi', 'bhangra', 'qawwali', 'ghazal', 'thumri', 'bhajan'],
    artistPatterns: /\b(kumar|singh|shah|kapoor|khan|agarwal|sharma|gupta|verma|yadav|jain|prasad|pandey|mishra|tiwari|dubey|shukla|srivastava|tripathi|chandra|dev|raj|lata|asha|kishore|mohammed|mukesh|jagjit|hariharan|shreya|sunidhi|arijit|rahat|kailash|sonu|udit|alka|kavita|anuradha|sadhana|laxmikant|pyarelal|ilaiyaraaja|a\.r\.rahman|shankar|ehsaan|loy|vishal|shekhar|sajid|wajid|himesh|anu|malik|nadeem|shravan)\b/i,
    titlePatterns: /\b(mere|tere|tera|mera|tumhe|tumko|kya|hai|hoon|ho|pyaar|mohabbat|ishq|dil|jaan|saath|zindagi|sapna|khushi|gham|judaai|milan|rab|allah|bhagwan|mata|pita|maa|beta|beti|bhai|behan|dost|yaar|shadi|baraat|sangam|milan|alvida|namaste|dhanyawad|shukriya)\b/i
  },
  spanish: {
    keywords: ['latin', 'salsa', 'bachata', 'reggaeton', 'merengue', 'cumbia', 'mariachi', 'ranchera', 'tango'],
    artistPatterns: /\b(martinez|rodriguez|garcia|lopez|gonzalez|hernandez|perez|sanchez|ramirez|torres|flores|rivera|gomez|diaz|reyes|morales|ortiz|gutierrez|chavez|ramos|castillo|mendoza|vargas|romero|herrera|medina|aguilar|jimenez|vega|castro|ruiz)\b/i,
    titlePatterns: /\b(mi|tu|el|la|los|las|un|una|con|sin|por|para|que|como|cuando|donde|amor|corazon|vida|tiempo|noche|dia|sol|luna|estrella|cielo|mar|fuego|agua|tierra|casa|familia|madre|padre|hijo|hija|hermano|hermana|amigo|amiga|novio|novia|esposo|esposa|baile|fiesta|musica|cancion|sueno|feliz|triste|loco|loca|bonito|bonita|guapo|guapa|beso|abrazo|te|amo|quiero|extraño|vuelve|adios|hola|gracias|si|no|nunca|siempre|todo|nada)\b/i
  },
  korean: {
    keywords: ['k-pop', 'kpop', 'korean', 'hallyu', 'idol', 'boy group', 'girl group'],
    artistPatterns: /\b(bts|blackpink|twice|red velvet|itzy|aespa|stray kids|seventeen|nct|exo|bigbang|super junior|girls generation|snsd|wonder girls|kara|sistar|t-ara|apink|mamamoo|gfriend|oh my girl|lovelyz|wjsn|cosmic girls|izone|everglow|gidle|g idle|soyeon|jennie|lisa|rose|jisoo|jimin|jungkook|v|rm|suga|jin|j-hope|taeyeon|yoona|tiffany|sunny|hyoyeon|sooyoung|yuri|seohyun|jessica|iu|suzy|sulli|krystal|victoria|amber|luna|chanyeol|baekhyun|kai|sehun|d\.o|chen|xiumin|lay|suho|kris|luhan|tao)\b/i,
    titlePatterns: /[가-힣]+/
  },
  japanese: {
    keywords: ['j-pop', 'jpop', 'japanese', 'anime', 'vocaloid', 'enka', 'shamisen'],
    artistPatterns: /\b(yamada|tanaka|suzuki|takahashi|watanabe|ito|nakamura|kobayashi|saito|kato|yoshida|yamamoto|sasaki|matsumoto|inoue|kimura|hayashi|shimizu|yamazaki|mori|abe|ikeda|hashimoto|yamashita|ishikawa|nakajima|maeda|fujita|ogawa|goto|okada|hasegawa|murakami|kondo|ishii|saito|sakamoto|aoki|fujii|nishimura|fukuda|ota|miura|fujiwara|okamoto|matsuda|nakagawa|endo|yamaguchi|kudo|ono|ishida|harada|sato|ueda|morita|hara|shibata|sakai|kudo|miyazaki|uchida|takeda|koizumi|ogawa|hirano|nishida|miyamoto)\b/i,
    titlePatterns: /[ひらがなカタカナ一-龯]+/
  },
  french: {
    keywords: ['french', 'chanson', 'variete', 'francophone'],
    artistPatterns: /\b(martin|bernard|thomas|dubois|robert|richard|petit|durand|leroy|moreau|simon|laurent|lefebvre|michel|garcia|david|bertrand|roux|vincent|fournier|morel|girard|andre|lefevre|mercier|dupont|lambert|bonnet|francois|martinez)\b/i,
    titlePatterns: /\b(je|tu|il|elle|nous|vous|ils|elles|le|la|les|un|une|des|mon|ma|mes|ton|ta|tes|son|sa|ses|notre|votre|leur|ce|cette|ces|qui|que|quoi|ou|quand|comment|pourquoi|avec|sans|dans|sur|sous|pour|par|de|du|des|au|aux|en|et|ou|mais|donc|or|ni|car|amour|coeur|vie|temps|jour|nuit|soleil|lune|ciel|mer|eau|feu|terre|maison|famille|mere|pere|fils|fille|frere|soeur|ami|amie|mari|femme|enfant|bebe|chat|chien|musique|chanson|danse|fete|bonheur|tristesse|joie|peur|reve|espoir|liberte|paix|guerre|travail|ecole|vacances|voyage|restaurant|hotel|voiture|train|avion|telephone|ordinateur|television|livre|film|theatre|cinema|sport|football|tennis|natation)\b/i
  },
  arabic: {
    keywords: ['arabic', 'arab', 'middle eastern', 'khaleeji', 'maghreb', 'levantine', 'oud', 'qanun', 'darbuka'],
    artistPatterns: /\b(mohammed|ahmad|ali|hassan|hussein|omar|khalid|ibrahim|abdel|abdul|amr|tamer|nancy|elissa|fairuz|umm kulthum|abdel halim|mohamed mounir|amr diab|tamer hosny|sherine|assala|nawal|majida|wael|ramy|hakim|mohamed hamaki)\b/i,
    titlePatterns: /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]+/
  },
  portuguese: {
    keywords: ['brazilian', 'brasil', 'bossa nova', 'samba', 'mpb', 'forro', 'pagode', 'axe', 'sertanejo'],
    artistPatterns: /\b(silva|santos|oliveira|souza|rodrigues|ferreira|alves|pereira|lima|gomes|ribeiro|carvalho|barbosa|araujo|costa|martins|rocha|almeida|nascimento|reis|ramos|azevedo|moreira|cardoso|teixeira|castro|andrade|machado|bruno|mars|caetano|veloso|gilberto|gil|djavan|milton|nascimento|gal|costa|maria|bethania|chico|buarque|roberto|carlos|raul|seixas|cazuza|renato|russo|skank|o|rappa|charlie|brown|jr|natiruts|cidade|negra|seu|jorge|marcelo|d2|criolo|emicida|racionais|mcs)\b/i,
    titlePatterns: /\b(o|a|os|as|um|uma|de|da|do|das|dos|em|na|no|nas|nos|por|para|com|sem|sobre|entre|ate|desde|amor|coracao|vida|tempo|noite|dia|sol|lua|estrela|ceu|mar|fogo|agua|terra|casa|familia|mae|pai|filho|filha|irmao|irma|amigo|amiga|namorado|namorada|marido|esposa|saudade|feliz|triste|alegria|dor|sonho|esperanca|liberdade|paz|guerra|trabalho|escola|ferias|viagem|praia|montanha|cidade|campo|musica|cancao|danca|festa|carnaval|futebol|capoeira|feijoada|cachaca|brasil|rio|sao|paulo|salvador|recife|fortaleza|belo|horizonte|brasilia|manaus|curitiba|porto|alegre)\b/i
  },
  punjabi: {
    keywords: ['punjabi', 'bhangra', 'dhol', 'tabla', 'sikh', 'guru', 'gurdwara', 'punjab', 'patiala', 'amritsar', 'chandigarh'],
    artistPatterns: /\b(gurdas|maan|diljit|dosanjh|sidhu|moose|wala|karan|aujla|ammy|virk|ninja|kulwinder|billa|amrit|mann|jasmine|sandlas|sunanda|sharma|miss|pooja|yo|yo|honey|singh|badshah|nucleya|divine|ikka|raftaar|kr|dollar|kaur)\b/i,
    titlePatterns: /\b(sanu|tenu|kudi|munda|jaan|pyaar|dil|gal|baat|yaar|bhaiya|paaji|veere|sohne|kala|gore|changa|sada|tere|mere|asi|tusi|ohda|inda|pind|gaon|sheher|ghar|maa|pyo|bebe|nana|nani|chacha|mama|tau|bua|maasi|pendu|jatt|sardar|kaur|singh)\b/i
  },
  marathi: {
    keywords: ['marathi', 'maharashtra', 'mumbai', 'pune', 'nashik', 'nagpur', 'lavani', 'powada', 'bhavgeet', 'natya sangeet'],
    artistPatterns: /\b(lata|mangeshkar|asha|bhosle|usha|mangeshkar|hridaynath|mangeshkar|pandit|jasraj|kishori|amonkar|shobha|gurtu|suresh|wadkar|mahesh|kale|ajay|atul|shankar|mahadevan|swapnil|bandodkar|vaishali|samant|kaushal|inamdar|bela|shende|rohit|raut)\b/i,
    titlePatterns: /\b(mi|tu|to|ti|aamhi|tumhi|te|tya|tyana|mala|tula|tyala|tila|aamhala|tumhala|prem|pyar|jeevan|kaal|raat|divas|surya|chandra|tara|akash|sagar|agni|pani|prithvi|ghar|kutumb|aai|baba|mulga|mulgi|bhau|bahin|mitra|saheli|navra|bayko|premala|ananda|dukha|swapna|asha|swatantra|shanti|yuddha|kam|shala|sutta|pravas|gaadi|ghar|paisa|khushi|dukhi|changa|vait|sundar|roop|chumbana|maitri|he|aahe|nahi|kayam|kabhi|sarvada|sarva|kai)\b/i
  },
  tamil: {
    keywords: ['tamil', 'kollywood', 'chennai', 'madras', 'tamilnadu', 'carnatic', 'bharatanatyam', 'gaana', 'kuthu'],
    artistPatterns: /\b(a\.r\.rahman|ilaiyaraaja|m\.s\.subbulakshmi|t\.m\.soundararajan|p\.susheela|s\.janaki|k\.j\.yesudas|s\.p\.balasubrahmanyam|hariharan|k\.s\.chithra|unni|krishnan|shankar|mahadevan|bombay|jayashri|sudha|ragunathan|vijay|yesudas|anirudh|ravichander|harris|jayaraj|yuvan|shankar|raja|d\.imman|gv|prakash|kumar|santhosh|narayanan|sid|sriram|chinmayi|shreya|ghoshal|karthik|haricharan|naresh|iyer)\b/i,
    titlePatterns: /\b(naan|nee|avan|aval|naama|neenga|avanga|enakku|unakku|avanukku|avalukku|namaakku|unga|avanga|kadhal|anbu|vaazhkai|neram|iravu|pagal|sooriyan|nilavu|velli|vaanam|kadal|thee|thanni|mann|veedu|kudumbam|amma|appa|magan|magal|anna|akka|nanban|thozi|kanavan|manaivi|inbam|thuyaram|kanavu|nambikkai|viduthalai|amaiti|por|velai|kalloori|nal|oodal|vandi|veedu|kaasu|sandosham|kastam|nalla|kettadhu|azhaga|kadhal|mutham|natpu|idhu|adhu|illa|engeyum|eppo|enna|yaar|enga|eppadi|yen|kooda|illama|ulle|mele|keezhe|munnaadi|pinnaadi)\b/i
  },
  telugu: {
    keywords: ['telugu', 'tollywood', 'hyderabad', 'andhra', 'telangana', 'carnatic', 'kuchipudi', 'folk telugu'],
    artistPatterns: /\b(s\.p\.balasubrahmanyam|k\.j\.yesudas|p\.susheela|s\.janaki|ghantasala|m\.s\.rama|rao|l\.r\.eswari|p\.b\.sreenivas|m\.m\.keeravani|a\.r\.rahman|ilaiyaraaja|devi|sri|prasad|thaman|s|mickey|j|meyer|anup|rubens|gopi|sundar|keeravani|m\.m|manisharma|vandemataram|srinivas|sai|karthik|shreya|ghoshal|kk|udit|narayan|hariharan|shankar|mahadevan|chithra|k\.s|sunitha|mallikarjun|tippu|rahul|nandkumar|ranjith|malavika|hemachandra|ramya|behera)\b/i,
    titlePatterns: /\b(nenu|nuvvu|atanu|aame|manam|miru|vaaru|naaku|neeku|ataniki|aameki|maanaki|miiru|vaallaki|prema|sneham|jeevitam|samayam|raatri|roju|sooryudu|chandrudu|nakshatram|aakaasam|samudram|agni|neeru|bhumi|intlu|kutumbam|amma|naanna|koduku|koothuru|anna|akka|sneehitudu|snehithuralu|bharya|bharta|aanandham|dukhaam|kala|aasha|vidyudhalai|shaanthi|yuddham|pani|badi|chhutti|yatra|kotha|intlu|dabbu|khushi|badha|manchidi|chedu|andham|muddu|premikudu|premika|idi|adi|ledu|akkada|ikkada|epudu|emiti|evaru|ala|enduku|tho|lekunda|lopala|meeda|kinda|mundhu|venaka)\b/i
  },
  gujarati: {
    keywords: ['gujarati', 'gujarat', 'ahmedabad', 'surat', 'vadodara', 'rajkot', 'garba', 'dandiya', 'bhajan', 'lok geet'],
    artistPatterns: /\b(hemant|chauhan|praful|dave|kirtidan|gadhvi|osman|mir|diwaliben|bhil|lalitya|munshaw|purushottam|upadhyay|vinod|rathod|alka|yagnik|abhijeet|bhattacharya|kumar|sanu|udit|narayan|anuradha|paudwal|sadhana|sargam|kavita|krishnamurthy|shaan|sunidhi|chauhan|shreya|ghoshal|kailash|kher|rahat|fateh|ali|khan|arijit|singh|atif|aslam|armaan|malik|asees|kaur|dhvani|bhanushali|jubin|nautiyal|darshan|raval|neha|kakkar|tony|kakkar|badshah|yo|yo|honey|singh)\b/i,
    titlePatterns: /\b(hu|tu|te|ame|tame|teo|mane|tane|tene|temane|amane|teone|prem|pyaar|jindagi|samay|raat|divas|suraj|chand|sitara|akash|sagar|aag|paani|dharti|ghar|parivar|mummy|papa|dikra|dikri|bhai|ben|mitra|saheli|pati|patni|anand|dukh|sapnu|asha|azadi|shanti|jung|kam|shala|chhuti|safar|gadi|paisa|khushi|dukh|saras|kharab|sundar|chokra|chokri|pappi|dosti|aa|te|nathi|tyare|ahiya|kyare|su|kon|kya|kem|sathe|vagar|ander|upar|niche|aage|pache)\b/i
  },
  bengali: {
    keywords: ['bengali', 'bangla', 'kolkata', 'dhaka', 'west bengal', 'bangladesh', 'rabindra sangeet', 'tagore', 'nazrul geeti', 'adhunik'],
    artistPatterns: /\b(rabindranath|tagore|kazi|nazrul|islam|hemanta|mukherjee|kishore|kumar|manna|dey|sandhya|mukherjee|arati|mukherjee|dwijen|mukherjee|manabendra|mukherjee|shyamal|mitra|alpana|banerjee|suchitra|mitra|pratima|banerjee|lata|mangeshkar|asha|bhosle|mohammed|rafi|mukesh|geeta|dutt|suman|chattopadhyay|mohan|singh|nachiketa|chakraborty|anjan|dutta|rupankar|bagchi|shreya|ghoshal|raghab|chatterjee|rupam|islam|anupam|roy|arijit|singh|armaan|malik|asees|kaur|dhvani|bhanushali)\b/i,
    titlePatterns: /\b(ami|tumi|se|amra|tomra|tara|amar|tomar|tar|amader|tomader|tader|bhalobasha|jiban|samay|raat|din|surjo|chand|tara|akash|sagar|agun|jol|mati|bari|poribar|ma|baba|chele|meye|dada|didi|bondhu|bondhobi|swami|stri|anondo|dukkho|swapno|asha|shadhinota|shanti|juddho|kaj|school|chuti|bhromon|gari|bari|taka|anondo|dukkho|bhalo|kharap|sundor|chumu|bondhutto|ei|oi|na|jekhane|ekhane|kokhon|ki|ke|kothay|kemon|keno|sathe|chara|bhitore|opore|niche|samne|pichone)\b/i
  },
  rajasthani: {
    keywords: ['rajasthani', 'rajasthan', 'jaipur', 'jodhpur', 'udaipur', 'bikaner', 'folk rajasthan', 'manganiyar', 'langas', 'kalbelia'],
    artistPatterns: /\b(mame|khan|kailash|kher|swaroop|khan|allah|jilai|bai|gavri|devi|gulabi|sapera|anwar|khan|barkat|ali|khan|ustad|sultan|khan|pandit|vishwa|mohan|bhatt|ustad|zakir|hussain|hariprasad|chaurasia|shivkumar|sharma|rahul|sharma|ravi|shankar|anoushka|shankar|niladri|kumar|tejendra|narayan|majumdar|brij|bhushan|kabra|rakesh|chaurasia|rajeev|taranath|n|rajam|l|subramaniam|l|shankar|vikku|vinayakram|mandolin|srinivas|u|shrinivas|kadri|gopalnath|t|h|subhash|chandran|ronu|majumdar)\b/i,
    titlePatterns: /\b(main|tu|wo|hum|tum|ve|mhane|thane|une|mhara|thara|unka|prem|pyar|zindagi|waqt|raat|din|suraj|chand|sitara|asman|samundar|aag|pani|zameen|ghar|pariwar|ma|bapu|beta|beti|bhai|behen|yaar|saheli|piya|dulhan|khushi|gham|sapna|umang|azadi|aman|jung|kaam|school|chhuti|safar|gadi|paisa|maze|dukh|acha|bura|sunder|chokra|chokri|pappi|dosti|ye|wo|nahi|jahan|yahan|kab|kya|kaun|kaise|kyun|ke|saath|bina|andar|upar|neeche|aage|peeche)\b/i
  },
  kannada: {
    keywords: ['kannada', 'karnataka', 'bangalore', 'mysore', 'mangalore', 'sandalwood', 'carnatic', 'yakshagana', 'sugama sangeetha'],
    artistPatterns: /\b(p\.b\.sreenivas|s\.janaki|vani|jairam|b\.r\.chaya|l\.r\.eswari|k\.j\.yesudas|s\.p\.balasubrahmanyam|p\.susheela|m\.s\.subbulakshmi|k\.s\.chithra|hariharan|unni|krishnan|srinivas|tippu|rajesh|krishnan|vijay|prakash|kunal|ganjawala|kailash|kher|shreya|ghoshal|udit|narayan|alka|yagnik|kavita|krishnamurthy|sadhana|sargam|anuradha|paudwal|lata|mangeshkar|asha|bhosle|mohammed|rafi|mukesh|kishore|kumar|manna|dey|hemanta|mukherjee|geeta|dutt|shamshad|begum|noor|jehan|suraiya|rajkumari|amirbai|karnataki)\b/i,
    titlePatterns: /\b(naanu|ninu|avanu|avalu|naavu|niivu|avaru|nanage|ninage|avanige|avalige|naavaadege|niiveega|avaruge|prem|sneha|jivana|samaya|raatri|dina|surya|chandra|nakshatra|aakaasha|samudra|agni|neeru|bhumi|mane|kutumba|amma|appa|maga|magalu|anna|akka|gejje|saheli|ganda|hendthi|aananda|dukhaa|kanasu|aashe|viduthalai|shaanti|yuddha|kelasa|shaale|chhutti|pravas|honda|mane|duddu|santoshaa|kashta|olle|keta|sundara|maga|magalu|mutti|snehithathe|idu|adu|illa|alli|illi|yaavu|yaavaga|enu|yaaru|hege|yaake|jote|illade|olle|mele|kelage|munche|hinde)\b/i
  },
  malayalam: {
    keywords: ['malayalam', 'kerala', 'kochi', 'trivandrum', 'kozhikode', 'mollywood', 'carnatic', 'kathakali', 'mohiniyattam'],
    artistPatterns: /\b(k\.j\.yesudas|s\.janaki|p\.susheela|m\.g\.sreekumar|k\.s\.chithra|sujatha|mohan|vani|jairam|b\.r\.chaya|m\.s\.baburaj|devarajan|johnson|vidyasagar|ilaiyaraaja|ouseppachan|m\.jayachandran|deepak|dev|gopi|sundar|shaan|rahman|bijibal|prashant|pillai|rahul|raj|rex|vijayan|jakes|bejoy|sushin|shyam|ravi|g|venugopal|hariharan|unni|krishnan|srinivas|vijay|yesudas|madhu|balakrishnan|manjari|swetha|mohan|rimi|tomy|afsal|najim|arshad|franco|vineeth|sreenivasan|karthik|udit|narayan|shreya|ghoshal)\b/i,
    titlePatterns: /\b(njaan|nee|avan|aval|njangal|ningal|avar|enikku|ninakku|avannu|avalkkku|njangalkku|ningalkku|avarkkku|sneham|jeevitham|samayam|raathri|divasam|sooriyan|chandran|nakshathram|aakaasham|samudram|theeyy|vellam|bhumi|veedu|kudumbam|amma|achan|makan|makal|chettan|chechi|koottukaran|koottukari|bharya|bharthaavu|anandam|dukhham|swapnam|pratheeksha|viduthalai|shaanthi|yuddham|pani|paadashaala|avdhikkaalam|yathra|vandi|veedu|paisa|santosham|kashtam|nallathu|cheyyaathathu|sundaram|amme|acchaa|umma|snehithan|ithu|athu|alla|avide|ivide|eppo|enthu|aarennu|engane|enthukond|koode|illaathe|ullil|mele|thaazhe|munpil|pinhil)\b/i
  },
  english: {
    keywords: ['english', 'american', 'british', 'uk', 'us', 'pop', 'rock', 'country', 'blues', 'jazz', 'hip-hop', 'rap', 'r&b', 'soul'],
    artistPatterns: /\b(smith|johnson|williams|brown|jones|garcia|miller|davis|rodriguez|martinez|hernandez|lopez|gonzalez|wilson|anderson|thomas|taylor|moore|jackson|martin|lee|perez|thompson|white|harris|sanchez|clark|ramirez|lewis|robinson|walker|young|allen|king|wright|scott|torres|nguyen|hill|flores|green|adams|nelson|baker|hall|rivera|campbell|mitchell|carter|roberts|gomez|phillips|evans|turner|diaz|parker|cruz|edwards|collins|reyes|stewart|morris|morales|murphy|cook|rogers|gutierrez|ortiz|morgan|cooper|peterson|bailey|reed|kelly|howard|ramos|kim|cox|ward|richardson|watson|brooks|chavez|wood|james|bennett|gray|mendoza|ruiz|hughes|price|alvarez|castillo|sanders|patel|myers|long|ross|foster|jimenez)\b/i,
    titlePatterns: /\b(i|you|he|she|we|they|the|a|an|and|or|but|so|if|when|where|why|how|what|who|which|this|that|these|those|my|your|his|her|our|their|me|him|her|us|them|love|heart|life|time|night|day|sun|moon|star|sky|sea|fire|water|earth|home|family|mother|father|son|daughter|brother|sister|friend|baby|man|woman|boy|girl|dance|party|music|song|dream|hope|freedom|peace|war|work|school|holiday|travel|car|house|money|happy|sad|good|bad|new|old|big|small|beautiful|ugly|hot|cold|fast|slow|yes|no|never|always|everything|nothing|something|anything|somewhere|nowhere|everywhere|anywhere|someone|no one|everyone|anyone|hello|goodbye|thank|please|sorry|excuse|welcome|congratulations)\b/i
  }

};

// Helper function to detect film industry based on patterns
function detectFilmIndustry(track: Track): 'bollywood' | 'hollywood' | 'tollywood' | 'kollywood' | 'mollywood' | 'sandalwood' | 'punjabi_cinema' | 'bhojpuri' | 'marathi_cinema' | 'international' | 'other' {
  const trackName = track.trackName.toLowerCase();
  const artistName = track.artistName.toLowerCase();
  const genre = track.primaryGenreName?.toLowerCase() || '';
  const searchText = `${trackName} ${artistName} ${genre}`;
  
  // Check each film industry pattern
  for (const [industry, patterns] of Object.entries(FILM_INDUSTRY_PATTERNS)) {
    const industryKey = industry as keyof typeof FILM_INDUSTRY_PATTERNS;
    
    // Check keywords
    if (patterns.keywords.some(keyword => searchText.includes(keyword))) {
      return industryKey;
    }
    
    // Check artist patterns
    if (patterns.artistPatterns.test(artistName)) {
      return industryKey;
    }
    
    // Check genre patterns
    if (patterns.genrePatterns.test(searchText)) {
      return industryKey;
    }
  }
  
  return 'other';
}

// Helper function to detect language based on patterns  
function detectLanguage(track: Track): 'english' | 'hindi' | 'spanish' | 'french' | 'korean' | 'japanese' | 'arabic' | 'portuguese' | 'punjabi' | 'marathi' | 'tamil' | 'telugu' | 'gujarati' | 'bengali' | 'rajasthani' | 'kannada' | 'malayalam' | 'other' {
  const trackName = track.trackName.toLowerCase();
  const artistName = track.artistName.toLowerCase();
  const searchText = `${trackName} ${artistName}`;
  
  // Check each language pattern
  for (const [lang, patterns] of Object.entries(LANGUAGE_PATTERNS)) {
    const langKey = lang as keyof typeof LANGUAGE_PATTERNS;
    
    // Check keywords
    if (patterns.keywords.some(keyword => searchText.includes(keyword))) {
      return langKey;
    }
    
    // Check artist patterns
    if (patterns.artistPatterns.test(artistName)) {
      return langKey;
    }
    
    // Check title patterns
    if (patterns.titlePatterns.test(trackName)) {
      return langKey;
    }
  }
  
  // Default to English for Western names and common English words
  if (LANGUAGE_PATTERNS.english.artistPatterns.test(artistName) || 
      LANGUAGE_PATTERNS.english.titlePatterns.test(trackName)) {
    return 'english';
  }
  
  return 'other';
}

/**
 * Analyzes a track to determine its vibe profile including language detection
 */
export function analyzeTrackVibe(track: Track): VibeProfile {
  const genre = track.primaryGenreName || '';
  const trackName = track.trackName.toLowerCase();
  const artistName = track.artistName.toLowerCase();
  const searchText = `${trackName} ${artistName}`.toLowerCase();
  
  // Detect language and film industry first
  const detectedLanguage = detectLanguage(track);
  const detectedFilmIndustry = detectFilmIndustry(track);
  
  // Start with genre-based analysis
  let vibeProfile: VibeProfile = {
    language: detectedLanguage,
    primaryGenre: genre,
    filmIndustry: detectedFilmIndustry
  };
  
  // Check genre mapping
  const genreMatch = GENRE_ENERGY_MAP[genre];
  if (genreMatch) {
    vibeProfile = {
      ...vibeProfile,
      genre: genre,
      energy: genreMatch.energy,
      mood: genreMatch.mood as any,
      tempo: genreMatch.tempo,
    };
  } else {
    // Default analysis if genre not found
    vibeProfile = {
      genre: genre || 'Unknown',
      energy: 'medium',
      mood: 'happy',
      tempo: 'medium',
    };
  }
  
  // Refine analysis based on track and artist names
  
  // Energy analysis
  const hasHighEnergyKeywords = HIGH_ENERGY_KEYWORDS.some(keyword => searchText.includes(keyword));
  const hasLowEnergyKeywords = LOW_ENERGY_KEYWORDS.some(keyword => searchText.includes(keyword));
  
  if (hasHighEnergyKeywords && !hasLowEnergyKeywords) {
    vibeProfile.energy = 'high';
    vibeProfile.tempo = 'fast';
  } else if (hasLowEnergyKeywords && !hasHighEnergyKeywords) {
    vibeProfile.energy = 'low';
    vibeProfile.tempo = 'slow';
  }
  
  // Mood analysis
  const hasHappyKeywords = HAPPY_KEYWORDS.some(keyword => searchText.includes(keyword));
  const hasSadKeywords = SAD_KEYWORDS.some(keyword => searchText.includes(keyword));
  const hasPartyKeywords = PARTY_KEYWORDS.some(keyword => searchText.includes(keyword));
  const hasChillKeywords = CHILL_KEYWORDS.some(keyword => searchText.includes(keyword));
  
  if (hasPartyKeywords) {
    vibeProfile.mood = 'party';
    vibeProfile.energy = 'high';
  } else if (hasSadKeywords) {
    vibeProfile.mood = 'sad';
    vibeProfile.energy = 'low';
  } else if (hasChillKeywords) {
    vibeProfile.mood = 'chill';
  } else if (hasHappyKeywords) {
    vibeProfile.mood = 'happy';
  }
  
  return vibeProfile;
}

/**
 * Calculates similarity score between two vibe profiles (0-1, higher = more similar)
 * Film industry compatibility has the highest priority, followed by language for DJ mixing
 */
export function calculateVibeCompatibility(vibe1: VibeProfile, vibe2: VibeProfile): number {
  let score = 0;
  let factors = 0;
  
  // Film industry compatibility (highest priority - maintains film industry continuity)
  if (vibe1.filmIndustry && vibe2.filmIndustry) {
    factors += 6; // Highest weight for film industry matching
    if (vibe1.filmIndustry === vibe2.filmIndustry) {
      score += 6; // Perfect film industry match
    } else {
      // Check compatible film industries
      const compatibleIndustries: Record<string, string[]> = {
        'bollywood': ['bhojpuri', 'marathi_cinema'], // Hindi cinema family
        'tollywood': ['kollywood', 'sandalwood', 'mollywood'], // South Indian cinema
        'kollywood': ['tollywood', 'sandalwood', 'mollywood'], // South Indian cinema  
        'mollywood': ['kollywood', 'tollywood', 'sandalwood'], // South Indian cinema
        'sandalwood': ['kollywood', 'tollywood', 'mollywood'], // South Indian cinema
        'punjabi_cinema': ['bollywood'], // Punjabi connects with Bollywood
        'bhojpuri': ['bollywood'], // Regional Hindi cinema
        'marathi_cinema': ['bollywood'], // Regional Indian cinema
        'hollywood': ['international'], // Western cinema
        'international': ['hollywood'] // Global music
      };
      
      if (compatibleIndustries[vibe1.filmIndustry]?.includes(vibe2.filmIndustry)) {
        score += 3; // Compatible film industries
      } else if (vibe1.filmIndustry !== 'other' && vibe2.filmIndustry !== 'other') {
        score += 0.5; // Different film industries
      } else {
        score += 2; // One or both unknown
      }
    }
  }
  
  // Language compatibility (second highest priority - critical for DJ flow)
  if (vibe1.language && vibe2.language) {
    factors += 4; // High weight for language matching
    if (vibe1.language === vibe2.language) {
      score += 4; // Perfect language match
    } else if (vibe1.language !== 'other' && vibe2.language !== 'other') {
      // Different languages but both identified = poor compatibility
      score += 0.5; // Very low score for different languages
    } else {
      // One or both are 'other' - neutral compatibility
      score += 2;
    }
  }
  
  // Primary genre similarity (high weight - second priority)
  if (vibe1.primaryGenre && vibe2.primaryGenre) {
    factors += 3;
    if (vibe1.primaryGenre === vibe2.primaryGenre) {
      score += 3; // Exact genre match
    } else {
      // Check if genres are in similar families
      const genreFamilies = [
        ['Electronic', 'Dance', 'House', 'Techno', 'Trance', 'Dubstep'],
        ['Hip-Hop/Rap', 'Rap'],
        ['Pop', 'Rock', 'Alternative', 'Indie Rock'],
        ['R&B/Soul', 'Soul'],
        ['Jazz', 'Blues'],
        ['Classical', 'Instrumental'],
        ['Country', 'Folk'],
        ['Ambient', 'Chillout', 'Downtempo'],
        ['Latin', 'Reggae', 'Reggaeton'],
        ['World', 'International', 'Bollywood', 'Bollywood']
      ];
      
      const family1 = genreFamilies.find(family => family.includes(vibe1.primaryGenre!));
      const family2 = genreFamilies.find(family => family.includes(vibe2.primaryGenre!));
      
      if (family1 && family2 && family1 === family2) {
        score += 2; // Same genre family
      } else {
        score += 0.5; // Different genre families
      }
    }
  }
  
  // Secondary genre similarity (medium weight) 
  if (vibe1.genre && vibe2.genre) {
    factors += 2;
    if (vibe1.genre === vibe2.genre) {
      score += 2;
    } else {
      // Check compatibility in analyzed genres
      const compatibleGenres: Record<string, string[]> = {
        'party': ['energetic', 'dance'],
        'energetic': ['party', 'dance'],
        'dance': ['party', 'energetic'],
        'chill': ['relaxed', 'ambient'],
        'relaxed': ['chill', 'ambient'],
        'ambient': ['chill', 'relaxed']
      };
      
      if (compatibleGenres[vibe1.genre]?.includes(vibe2.genre)) {
        score += 1;
      }
    }
  }
  
  // Energy similarity (medium weight)
  if (vibe1.energy && vibe2.energy) {
    factors += 2;
    if (vibe1.energy === vibe2.energy) {
      score += 2;
    } else if (
      (vibe1.energy === 'medium' && vibe2.energy !== 'medium') ||
      (vibe2.energy === 'medium' && vibe1.energy !== 'medium')
    ) {
      score += 1; // Medium energy is compatible with both high and low
    }
  }
  
  // Mood similarity (medium weight)
  if (vibe1.mood && vibe2.mood) {
    factors += 2;
    if (vibe1.mood === vibe2.mood) {
      score += 2;
    } else {
      // Check mood compatibility
      const compatibleMoods: Record<string, string[]> = {
        'happy': ['energetic', 'party'],
        'energetic': ['happy', 'party'],
        'party': ['happy', 'energetic'],
        'chill': ['relaxed'],
        'relaxed': ['chill'],
        'sad': [], // Sad is generally not compatible with other moods
      };
      
      if (compatibleMoods[vibe1.mood]?.includes(vibe2.mood)) {
        score += 1;
      }
    }
  }
  
  // Tempo similarity (low weight)
  if (vibe1.tempo && vibe2.tempo) {
    factors += 1;
    if (vibe1.tempo === vibe2.tempo) {
      score += 1;
    } else if (
      (vibe1.tempo === 'medium' && vibe2.tempo !== 'medium') ||
      (vibe2.tempo === 'medium' && vibe1.tempo !== 'medium')
    ) {
      score += 0.5; // Medium tempo is somewhat compatible
    }
  }
  
  return factors > 0 ? score / factors : 0;
}

/**
 * Generates search queries to find similar tracks based on vibe profile with language priority
 */
export function generateVibeSearchQueries(vibeProfile: VibeProfile, excludeArtist?: string): string[] {
  const queries: string[] = [];
  
  // Language-specific searches (highest priority)
  if (vibeProfile.language) {
    const languageSearchTerms: Record<string, string[]> = {
      hindi: ['hindi song', 'bollywood', 'desi music', 'indian music', 'bhangra', 'romantic hindi'],
      spanish: ['spanish song', 'latin music', 'reggaeton', 'salsa', 'bachata', 'musica latina'],
      korean: ['k-pop', 'korean music', 'kpop song', 'hallyu', 'korean pop'],
      japanese: ['j-pop', 'japanese music', 'jpop song', 'anime music'],
      french: ['french song', 'chanson francaise', 'musique francaise'],
      arabic: ['arabic song', 'arabic music', 'middle eastern'],
      portuguese: ['brazilian music', 'musica brasileira', 'bossa nova', 'samba'],
      english: ['popular songs', 'top hits', 'english songs']
    };
    
    const langTerms = languageSearchTerms[vibeProfile.language as keyof typeof languageSearchTerms];
    if (langTerms) {
      // Add language-specific searches with genre
      if (vibeProfile.primaryGenre) {
        langTerms.forEach(term => {
          queries.push(`${term} ${vibeProfile.primaryGenre}`);
        });
      }
      
      // Add language-specific searches with mood
      if (vibeProfile.mood) {
        langTerms.forEach(term => {
          queries.push(`${term} ${vibeProfile.mood}`);
        });
      }
      
      // Add pure language searches
      queries.push(...langTerms.slice(0, 3)); // Top 3 language terms
    }
  }
  
  // Primary genre-based searches
  if (vibeProfile.primaryGenre) {
    queries.push(vibeProfile.primaryGenre);
    queries.push(`${vibeProfile.primaryGenre} music`);
  }
  
  // Mood + Energy combinations
  if (vibeProfile.mood && vibeProfile.energy) {
    const moodEnergyMap = {
      'party-high': ['party music', 'dance hits', 'club music', 'party songs'],
      'energetic-high': ['upbeat songs', 'high energy music', 'workout music'],
      'happy-medium': ['feel good music', 'happy songs', 'uplifting music'],
      'chill-low': ['chill music', 'relaxing songs', 'mellow music'],
      'relaxed-low': ['chill out music', 'ambient music', 'peaceful songs'],
      'sad-low': ['sad songs', 'emotional music', 'melancholy music'],
    };
    
    const key = `${vibeProfile.mood}-${vibeProfile.energy}` as keyof typeof moodEnergyMap;
    if (moodEnergyMap[key]) {
      queries.push(...moodEnergyMap[key]);
    }
  }
  
  // Tempo-based searches
  if (vibeProfile.tempo) {
    const tempoQueries = {
      'fast': ['fast songs', 'upbeat music', 'energetic tracks'],
      'medium': ['mid tempo music', 'moderate pace songs'],
      'slow': ['slow songs', 'ballads', 'slow tempo music'],
    };
    
    if (tempoQueries[vibeProfile.tempo]) {
      queries.push(...tempoQueries[vibeProfile.tempo]);
    }
  }
  
  // Genre-specific searches
  if (vibeProfile.genre) {
    const genreQueries = {
      'Electronic': ['electronic dance music', 'EDM', 'electronic beats'],
      'Hip-Hop/Rap': ['hip hop music', 'rap songs', 'hip hop beats'],
      'Pop': ['pop hits', 'popular music', 'pop songs'],
      'Rock': ['rock music', 'rock songs', 'guitar music'],
      'Jazz': ['jazz music', 'smooth jazz', 'jazz standards'],
      'Classical': ['classical music', 'orchestral music', 'instrumental classical'],
    };
    
    if (genreQueries[vibeProfile.genre as keyof typeof genreQueries]) {
      queries.push(...genreQueries[vibeProfile.genre as keyof typeof genreQueries]);
    }
  }
  
  // Remove duplicates and limit to top 5 queries
  return Array.from(new Set(queries)).slice(0, 5);
}