// Job filtering and categorization logic for Managify
// Adapted from Python job scraper

// Keyword dictionaries for job categories
const keywordsDict = {
    'sde': ["software development", "software engineer", "software engineering",
        "software developer", "development", "backend engineer", "sde", "swe", "backend",
        "frontend", "fullstack", "full", "stack", "front", "system", "systems",
        "cloud", "devops", "application", "api", "platform", "site"],

    'aiml': ["machine learning", "artificial intelligence", "ai", "ml", "mlops",
        "cloud", "devops", "generative", "deep", "data", "applied"],

    'cv': ["computer vision", "computer", "vision", "perception", "cv", "image", "object", "detection",
        "autonomous"],

    'nlp': ["nlp", "natural language processing", "llm", "generative", "linguist",
        "language", "applied"],

    'robo': ["robotics", "robot", "mechatronics", "automation", "autonomous"],
};

// Patterns to ignore (filter out irrelevant jobs)
const ignoreDict = {
    'title': ["staff", "sr.", "sr", "senior", "manager", "lead", "chief", "principal", "director",
        "sales", "head", "mechanical", "ii", "iii", "iv", "l2", "l3", "2", "3", "4",
        "management", "consultant", "phd", "manufacturing", "law", "maintenance",
        "construction", "clearance", "structures", "helpdesk", "electrical", "propulsion",
        "solution", "solutions", "customer"],
    'description': ["clearance", "itar"]
};

// USA locations (states, abbreviations, major cities)
const usaKeywords = ['None', 'remote', 'na', 'silicon valley', 'alabama', 'al', 'kentucky', 'ky', 'ohio', 'oh', 'alaska', 'ak', 'louisiana', 'la', 'oklahoma', 'ok', 'arizona', 'az', 'maine', 'me', 'oregon', 'or', 'arkansas', 'ar', 'maryland', 'md', 'pennsylvania', 'pa', 'american samoa', 'as', 'massachusetts', 'ma', 'puerto rico', 'pr', 'california', 'ca', 'michigan', 'mi', 'rhode island', 'ri', 'colorado', 'co', 'minnesota', 'mn', 'south carolina', 'sc', 'connecticut', 'ct', 'mississippi', 'ms', 'south dakota', 'sd', 'delaware', 'de', 'missouri', 'mo', 'tennessee', 'tn', 'district of columbia', 'dc', 'montana', 'mt', 'texas', 'tx', 'florida', 'fl', 'nebraska', 'ne', 'trust territories', 'tt', 'georgia', 'ga', 'nevada', 'nv', 'utah', 'ut', 'guam', 'gu', 'new hampshire', 'nh', 'vermont', 'vt', 'hawaii', 'hi', 'new jersey', 'nj', 'virginia', 'va', 'idaho', 'id', 'new mexico', 'nm', 'virgin islands', 'vi', 'illinois', 'il', 'new york', 'ny', 'washington', 'wa', 'indiana', 'in', 'north carolina', 'nc', 'west virginia', 'wv', 'iowa', 'ia', 'north dakota', 'nd', 'wisconsin', 'wi', 'kansas', 'ks', 'northern mariana islands', 'mp', 'wyoming', 'wy', 'usa', 'united states', 'united', 'states', 'us', 'new york', 'los angeles', 'chicago', 'houston', 'phoenix', 'philadelphia', 'san antonio', 'san diego', 'dallas', 'san jose', 'austin', 'jacksonville', 'fort worth', 'columbus', 'charlotte', 'san francisco', 'indianapolis', 'seattle', 'denver', 'washington', 'boston', 'el paso', 'nashville', 'detroit', 'oklahoma city', 'portland', 'las vegas', 'memphis', 'louisville', 'baltimore', 'milwaukee', 'albuquerque', 'tucson', 'fresno', 'sacramento', 'mesa', 'kansas city', 'atlanta', 'long beach', 'omaha', 'raleigh', 'colorado springs', 'miami', 'virginia beach', 'oakland', 'minneapolis', 'tulsa', 'arlington', 'tampa', 'new orleans', 'wichita', 'cleveland', 'bakersfield', 'aurora', 'anaheim', 'honolulu', 'santa ana', 'riverside', 'corpus christi', 'lexington', 'stockton', 'henderson', 'saint paul', 'st. louis', 'cincinnati', 'pittsburgh', 'greensboro', 'anchorage', 'plano', 'lincoln', 'orlando', 'irvine', 'newark', 'toledo', 'durham', 'chula vista', 'fort wayne', 'jersey city', 'st. petersburg', 'laredo', 'madison', 'chandler', 'buffalo', 'lubbock', 'scottsdale', 'reno', 'glendale', 'gilbert', 'winston–salem', 'north las vegas', 'norfolk', 'chesapeake', 'garland', 'irving', 'hialeah', 'fremont', 'boise', 'richmond', 'baton rouge', 'spokane', 'des moines', 'tacoma', 'san bernardino', 'modesto', 'fontana', 'santa clarita', 'birmingham', 'oxnard', 'fayetteville', 'moreno valley', 'rochester', 'glendale', 'huntington beach', 'salt lake city', 'grand rapids', 'amarillo', 'yonkers', 'aurora', 'montgomery', 'akron', 'little rock', 'huntsville', 'augusta', 'port st. lucie', 'grand prairie', 'columbus', 'tallahassee', 'overland park', 'tempe', 'mckinney', 'mobile', 'cape coral', 'shreveport', 'frisco', 'knoxville', 'worcester', 'brownsville', 'vancouver', 'fort lauderdale', 'sioux falls', 'ontario', 'chattanooga', 'providence', 'newport news', 'rancho cucamonga', 'santa rosa', 'oceanside', 'salem', 'elk grove', 'garden grove', 'pembroke pines', 'peoria', 'eugene', 'corona', 'cary', 'springfield', 'fort collins', 'jackson', 'alexandria', 'hayward', 'lancaster', 'lakewood', 'clarksville', 'palmdale', 'salinas', 'springfield', 'hollywood', 'pasadena', 'sunnyvale', 'macon', 'pomona', 'escondido', 'killeen', 'naperville', 'joliet', 'bellevue', 'rockford', 'savannah', 'paterson', 'torrance', 'bridgeport', 'mcallen', 'mesquite', 'syracuse', 'midland', 'pasadena', 'murfreesboro', 'miramar', 'dayton', 'fullerton', 'olathe', 'orange', 'thornton', 'roseville', 'denton', 'waco', 'surprise', 'carrollton', 'west valley city', 'charleston', 'warren', 'hampton', 'gainesville', 'visalia', 'coral springs', 'columbia', 'cedar rapids', 'sterling heights', 'new haven', 'stamford', 'concord', 'kent', 'santa clara', 'elizabeth', 'round rock', 'thousand oaks', 'lafayette', 'athens', 'topeka', 'simi valley', 'fargo', 'norman', 'columbia', 'abilene', 'wilmington', 'hartford', 'victorville', 'pearland', 'vallejo', 'ann arbor', 'berkeley', 'allentown', 'richardson', 'odessa', 'arvada', 'cambridge', 'sugar land', 'beaumont', 'lansing', 'evansville', 'rochester', 'independence', 'fairfield', 'provo', 'clearwater', 'college station', 'west jordan', 'carlsbad', 'el monte', 'murrieta', 'temecula', 'springfield', 'palm bay', 'costa mesa', 'westminster', 'north charleston', 'miami gardens', 'manchester', 'high point', 'downey', 'clovis', 'pompano beach', 'pueblo', 'elgin', 'lowell', 'antioch', 'west palm beach', 'peoria', 'everett', 'wilmington', 'ventura', 'centennial', 'lakeland', 'gresham', 'richmond', 'billings', 'inglewood', 'broken arrow', 'sandy springs', 'jurupa valley', 'hillsboro', 'waterbury', 'santa maria', 'boulder', 'greeley', 'daly city', 'meridian', 'lewisville', 'davie', 'west covina', 'league city', 'tyler', 'norwalk', 'san mateo', 'green bay', 'wichita falls', 'sparks', 'lakewood', 'burbank', 'rialto', 'allen', 'el cajon', 'las cruces', 'renton', 'davenport', 'south bend', 'vista', 'tuscaloosa', 'clinton', 'edison', 'woodbridge', 'san angelo', 'kenosha', 'vacaville', 'south gate', 'roswell', 'new bedford', 'yuma', 'longmont', 'brockton', 'quincy', 'sandy', 'waukegan', 'gulfport', 'hesperia', 'bossier city', 'suffolk', 'rochester hills', 'bellingham', 'gary', 'arlington heights', 'livonia', 'tracy', 'edinburg', 'kirkland', 'trenton', 'medford', 'milpitas', 'mission viejo', 'blaine', 'newton', 'upland', 'chino', 'san leandro', 'reading', 'norwalk', 'lynn', 'dearborn', 'new rochelle', 'plantation', 'baldwin park', 'scranton', 'eagan', 'lynnwood', 'utica', 'redwood city', 'dothan', 'carmel', 'merced', 'brooklyn park', 'tamarac', 'burnsville', 'charleston', 'alafaya', 'tustin', 'mount vernon', 'meriden', 'baytown', 'taylorsville', 'turlock', 'apple valley', 'fountain valley', 'leesburg', 'longview', 'bristol', 'valdosta', 'champaign', 'new braunfels', 'san marcos', 'flagstaff', 'manteca', 'santa barbara', 'kennewick', 'roswell', 'harlingen', 'caldwell', 'long beach', 'dearborn', 'murray', 'bryan', 'gainesville', 'lauderhill', 'madison', 'albany', 'joplin', 'missoula', 'iowa city', 'johnson city', 'rapid city', 'sugar land', 'oshkosh', 'mountain view', 'cranston', 'bossier city', 'lawrence', 'bismarck', 'anderson', 'bristol', 'bellingham', 'gulfport', 'dothan', 'farmington', 'redding', 'bryan', 'riverton', 'folsom', 'rock hill', 'new britain', 'carmel', 'temple', 'coral gables', 'concord', 'santa monica', 'wichita falls', 'sioux city', 'hesperia', 'warwick', 'boynton beach', 'troy', 'rosemead', 'missouri city', 'jonesboro', 'perris', 'apple valley', 'hemet', 'whittier', 'carson', 'milpitas', 'midland', 'eastvale', 'upland', 'bolingbrook', 'highlands ranch', 'st. cloud', 'west allis', 'rockville', 'cape coral', 'bowie', 'dubuque', 'broomfield', 'germantown', 'west sacramento', 'north little rock', 'pinellas park', 'casper', 'lancaster', 'gilroy', 'san ramon', 'new rochelle', 'kokomo', 'southfield', 'indian trail', 'cuyahoga falls', 'alameda', 'fort smith', 'kettering', 'carlsbad', 'cedar park', 'twin falls', 'portsmouth', 'sanford', 'chino hills', 'wheaton', 'largo', 'sarasota', 'aliso viejo', 'port orange', 'oak lawn', 'chapel hill', 'redmond', 'milford', 'apopka', 'avondale', 'plainfield', 'auburn', 'doral', 'bozeman', 'jupiter', 'west haven', 'hoboken', 'hoffman estates', 'eagan', 'blaine', 'apex', 'tinley park', 'palo alto', 'orland park', "coeur d'alene", 'burleson', 'casa grande', 'pittsfield', 'decatur', 'la habra', 'dublin', 'marysville', 'north port', 'valdosta', 'twin falls', 'blacksburg', 'perris', 'caldwell', 'largo', 'bartlett', 'middletown', 'decatur', 'warwick', 'conroe', 'waterloo', 'oakland park', 'bartlesville', 'wausau', 'harrisonburg', 'farmington hills', 'la crosse', 'enid', 'pico rivera', 'newark', 'palm coast', 'wellington', 'calexico', 'lancaster', 'north miami', 'riverton', 'blacksburg', 'goodyear', 'roseville', 'homestead', 'hoffman estates', 'montebello', 'casa grande', 'morgan hill', 'milford', 'murray', 'jackson', 'blaine', 'port arthur', 'kearny', 'bullhead city', 'castle rock', 'st. cloud', 'grand island', 'rockwall', 'westfield', 'little elm', 'la puente', 'lehi', 'diamond bar', 'keller', 'harrisonburg', 'saginaw', 'sammamish', 'kendall', 'georgetown', 'owensboro', 'trenton', 'keller', 'findlay', 'lakewood', 'leander', 'rocklin', 'san clemente', 'sheboygan', 'kennewick', 'draper', 'menifee', 'cuyahoga falls', 'johnson city', 'manhattan', 'rowlett', 'san bruno', 'coon rapids', 'murray', 'revere', 'sheboygan', 'east orange', 'south jordan', 'highland', 'la quinta', 'alamogordo', 'madison', 'broomfield', 'beaumont', 'newark', 'weston', 'peabody', 'union city', 'coachella', 'palatine', 'montebello', 'taylorsville', 'twin falls', 'east lansing', 'alamogordo', 'la mesa', 'blaine', 'pittsburg', 'caldwell', 'hoboken', 'huntersville', 'south whittier', 'redlands', 'janesville', 'beverly', 'burien', 'owensboro', 'wheaton', 'redmond', 'glenview', 'leominster', 'bountiful', 'oak creek', 'florissant', 'commerce city', 'pflugerville', 'westfield', 'auburn', 'shawnee', 'san rafael', 'alamogordo', 'murray', 'brentwood', 'revere', 'pflugerville', 'aliso viejo', 'auburn', 'florissant', 'national city', 'la mesa', 'leominster', 'pico rivera', 'castle rock', 'springfield'];

/**
 * Check if a location is in the USA
 * @param {string} location - The job location string
 * @returns {boolean} - True if location is in USA or N/A
 */
function isInUSA(location) {
    if (!location || location === 'N/A') {
        return true;
    }

    const delimiters = [",", "/", "-", "(", ")"];
    const pattern = new RegExp(delimiters.map(d => d.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'));

    const words = location.split(pattern);
    for (const word of words) {
        if (usaKeywords.includes(word.trim().toLowerCase())) {
            return true;
        }
    }
    return false;
}

/**
 * Determine the category of a job based on keywords
 * @param {string} jobTitle - The job title
 * @param {string} jobDescription - The job description
 * @returns {string|null} - Category key (sde, aiml, cv, nlp, robo) or null
 */
function determineCategory(jobTitle, jobDescription) {
    if (!jobTitle && !jobDescription) return null;

    const titleLower = (jobTitle || '').toLowerCase();
    const descLower = (jobDescription || '').toLowerCase();

    // Score each category based on keyword matches
    const scores = {};
    for (const [category, keywords] of Object.entries(keywordsDict)) {
        let score = 0;
        for (const keyword of keywords) {
            const keywordLower = keyword.toLowerCase();
            if (titleLower.includes(keywordLower)) score += 2; // Title matches worth more
            if (descLower.includes(keywordLower)) score += 1;
        }
        scores[category] = score;
    }

    // Return category with highest score, or null if no matches
    const maxScore = Math.max(...Object.values(scores));
    if (maxScore === 0) return null;

    return Object.keys(scores).find(key => scores[key] === maxScore);
}

/**
 * Check if a job is relevant based on keywords and ignore patterns
 * @param {string} jobTitle - The job title
 * @param {string} jobDescription - The job description
 * @returns {boolean} - True if job is relevant
 */
function isRelevantRole(jobTitle, jobDescription) {
    if (!jobTitle && !jobDescription) {
        return true; // Can't determine, assume relevant
    }

    const titleLower = (jobTitle || '').toLowerCase();
    const descLower = (jobDescription || '').toLowerCase();

    // Check if title contains any ignore patterns
    for (const ignored of ignoreDict.title) {
        if (titleLower.includes(ignored)) {
            return false;
        }
    }

    // Check if description contains any ignore patterns
    for (const ignored of ignoreDict.description) {
        if (descLower.includes(ignored)) {
            return false;
        }
    }

    // Check if title or description contains relevant keywords
    const allKeywords = Object.values(keywordsDict).flat();
    for (const keyword of allKeywords) {
        const keywordLower = keyword.toLowerCase();
        if (titleLower.includes(keywordLower) || descLower.includes(keywordLower)) {
            return true;
        }
    }

    return false; // No matching keywords found
}

/**
 * Get category display name and color
 * @param {string|null} category - Category key
 * @returns {object} - Display name and color
 */
function getCategoryInfo(category) {
    const categoryMap = {
        'sde': { name: 'Software Dev', color: '#3b82f6' },      // blue
        'aiml': { name: 'AI/ML', color: '#8b5cf6' },            // purple
        'cv': { name: 'Computer Vision', color: '#ec4899' },     // pink
        'nlp': { name: 'NLP', color: '#10b981' },               // green
        'robo': { name: 'Robotics', color: '#f59e0b' }          // amber
    };

    return categoryMap[category] || { name: 'Other', color: '#6b7280' }; // gray
}

/**
 * Analyze a job posting
 * @param {object} jobData - Job data object with title, description, location
 * @returns {object} - Analysis result with category, isRelevant, inUSA
 */
function analyzeJob(jobData) {
    const { title, description, location } = jobData;

    const category = determineCategory(title, description);
    const isRelevant = isRelevantRole(title, description);
    const inUSA = isInUSA(location);

    return {
        category,
        isRelevant: isRelevant && inUSA,
        inUSA,
        categoryInfo: getCategoryInfo(category)
    };
}

// Export for use in content script
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        isInUSA,
        determineCategory,
        isRelevantRole,
        getCategoryInfo,
        analyzeJob,
        keywordsDict,
        ignoreDict
    };
}
