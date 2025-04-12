document.addEventListener('DOMContentLoaded', function() {
    const storedLang = localStorage.getItem('preferredLanguage') || 'en';
    document.documentElement.lang = storedLang;
    updateLanguageButton(storedLang);
    translatePage(storedLang);
});

function toggleLanguage() {
    const currentLang = document.documentElement.lang;
    const newLang = currentLang === 'en' ? 'ro' : 'en';
    
    document.documentElement.lang = newLang;
    localStorage.setItem('preferredLanguage', newLang);
    translatePage(newLang);
    updateLanguageButton(newLang);
}

function updateLanguageButton(currentLang) {
    const button = document.querySelector('.lang-toggle');
    if (button) {
        // Show the current language
        button.textContent = currentLang.toUpperCase();
    }
}

function translatePage(lang) {
    const translations = {
        en: {
            home: "Home",
            collections: "Collections",
            aboutUs: "About Us",
            contact: "Contact",
            register: "Register",
            loginHere: "Login here",
            alreadyHaveAccount: "Already have an account?",
            send: "Send",
            name: "Name:",
            email: "Email:",
            message: "Message:",
            refineSelection: "Refine Selection",
            fragranceFamily: "Fragrance Family",
            gender: "Gender",
            priceRange: "Price Range",
            floral: "Floral",
            oriental: "Oriental",
            woody: "Woody",
            fresh: "Fresh",
            women: "Women",
            men: "Men",
            unisex: "Unisex",
            under50: "Under $50",
            between50And100: "$50 - $100",
            between100And200: "$100 - $200",
            over200: "Over $200",
            ourCollections: "Our Collections",
            perfumeEncyclopedia: "Perfume Encyclopedia",
            searchPlaceholder: "Search perfumes...",
            search: "Search",
            discoverFragrances: "Discover The World of Fragrances",
            goldenBliss: "Golden Bliss",
            mainAccords: "Main Accords",
            vanilla: "Vanilla",
            amber: "Amber",
            woody: "Woody",
            ratingScore: "4.2/5",
            topNotes: "Top Notes:",
            heartNotes: "Heart Notes:",
            baseNotes: "Base Notes:",
            bergamot: "Bergamot",
            lavender: "Lavender",
            jasmine: "Jasmine",
            musk: "Musk",
            fullReview: "Full Review",
            contactUs: "Contact Us",
            send: "Send",
            ourStory: "Our Story",
            welcomeMessage: "Welcome to Whiff & Wonder, where passion for fragrance meets luxury...",
            authenticFragrances: "Authentic luxury fragrances",
            expertService: "Expert customer service",
            curatedCollections: "Carefully curated collections",
            globalSelection: "Global fragrance selection",
            missionStatement: "Our mission is to help you discover your signature scent. Each fragrance in our collection is carefully selected to ensure the highest quality and authenticity. We believe that perfume is more than just a scent – it's an expression of personality, a memory creator, and a confidence booster.",
            expertGuidance: "With decades of combined experience in the fragrance industry, our team of experts is here to guide you through your perfume journey. Whether you're looking for a classic scent or exploring contemporary creations, we're here to help you find the perfect match.",
            prideStatement: "At Whiff & Wonder, we pride ourselves on:"
        },
        ro: {
            home: "Acasă",
            collections: "Colecții",
            aboutUs: "Despre Noi",
            contact: "Contact",
            register: "Înregistrare",
            loginHere: "Autentifică-te aici",
            alreadyHaveAccount: "Ai deja un cont?",
            send: "Trimite",
            name: "Nume:",
            email: "Email:",
            message: "Mesaj:",
            refineSelection: "Rafinează Selecția",
            fragranceFamily: "Familia Parfumului",
            gender: "Gen",
            priceRange: "Interval de Preț",
            floral: "Floral",
            oriental: "Oriental",
            woody: "Lemnos",
            fresh: "Proaspăt",
            women: "Femei",
            men: "Bărbați",
            unisex: "Unisex",
            under50: "Sub 50$",
            between50And100: "50$ - 100$",
            between100And200: "100$ - 200$",
            over200: "Peste 200$",
            ourCollections: "Colecțiile Noastre",
            perfumeEncyclopedia: "Enciclopedia Parfumurilor",
            searchPlaceholder: "Caută parfumuri...",
            search: "Caută",
            discoverFragrances: "Descoperă Lumea Parfumurilor",
            goldenBliss: "Fericire Aurie",
            mainAccords: "Acorduri Principale",
            vanilla: "Vanilie",
            amber: "Chihlimbar",
            woody: "Lemnos",
            ratingScore: "4.2/5",
            topNotes: "Note de Vârf:",
            heartNotes: "Note de Mijloc:",
            baseNotes: "Note de Bază:",
            bergamot: "Bergamotă",
            lavender: "Lavandă",
            jasmine: "Iasomie",
            musk: "Mosc",
            fullReview: "Recenzie Completă",
            contactUs: "Contactează-ne",
            send: "Trimite",
            ourStory: "Povestea Noastră",
            welcomeMessage: "Bine ați venit la Whiff & Wonder, unde pasiunea pentru parfumuri întâlnește luxul...",
            authenticFragrances: "Parfumuri autentice de lux",
            expertService: "Servicii pentru clienți de expert",
            curatedCollections: "Colecții atent selectate",
            globalSelection: "Selecție globală de parfumuri",
            missionStatement: "Misiunea noastră este să vă ajutăm să descoperiți parfumul semnăturii dvs. Fiecare parfum din colecția noastră este selectat cu atenție pentru a asigura cea mai înaltă calitate și autenticitate. Credem că parfumul este mai mult decât un miros – este o expresie a personalității, un creator de amintiri și un impuls de încredere.",
            expertGuidance: "Cu decenii de experiență combinată în industria parfumurilor, echipa noastră de experți este aici pentru a vă ghida în călătoria dvs. de descoperire a parfumurilor. Indiferent dacă căutați un parfum clasic sau explorați creații contemporane, suntem aici pentru a vă ajuta să găsiți potrivirea perfectă.",
            prideStatement: "La Whiff & Wonder, ne mândrim cu:"
        }
    };

    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.getAttribute('data-translate');
        if (translations[lang][key]) {
            element.textContent = translations[lang][key];
        }
    });
}
