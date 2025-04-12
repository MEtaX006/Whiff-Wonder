document.addEventListener('DOMContentLoaded', () => {
    const langButton = document.querySelector('.lang-toggle');
    if (langButton) {
        const currentLang = localStorage.getItem('preferredLanguage') || 'en';
        langButton.textContent = currentLang.toUpperCase();
        langButton.setAttribute('data-current-lang', currentLang);
    }
});

function toggleLanguage() {
    const langButton = document.querySelector('.lang-toggle');
    const currentLang = langButton.getAttribute('data-current-lang') || 'en';
    const newLang = currentLang === 'en' ? 'ro' : 'en';
    
    try {
        translatePage(newLang);
        langButton.textContent = newLang.toUpperCase();
        langButton.setAttribute('data-current-lang', newLang);
        localStorage.setItem('preferredLanguage', newLang);

        // Update document title if translation exists
        const pageTitleKey = document.title.split(' - ')[0].toLowerCase();
        if (translations[newLang] && translations[newLang][pageTitleKey]) {
            document.title = `${translations[newLang][pageTitleKey]} - Whiff & Wonder`;
        }

        // Update meta description if it exists
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription && translations[newLang].metaDescription) {
            metaDescription.content = translations[newLang].metaDescription;
        }

        // Dispatch event for components that need to know about language changes
        document.dispatchEvent(new CustomEvent('languageChanged', {
            detail: {
                language: newLang,
                translations: translations[newLang]
            }
        }));

    } catch (error) {
        console.error('Language toggle error:', error);
        // Revert to previous language if there's an error
        langButton.textContent = currentLang.toUpperCase();
        langButton.setAttribute('data-current-lang', currentLang);
    }
}

function updateLanguage(newLang) {
    document.documentElement.lang = newLang;
    localStorage.setItem('preferredLanguage', newLang);
    translatePage(newLang);
    updateLanguageButton(newLang);
}

function updateLanguageButton(currentLang) {
    const button = document.querySelector('.lang-toggle');
    if (button) {
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
            prideStatement: "At Whiff & Wonder, we pride ourselves on:",
            todaysStars: "Today's Stars"
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
            prideStatement: "La Whiff & Wonder, ne mândrim cu:",
            todaysStars: "Stelele Zilei"
        }
    };

    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.getAttribute('data-translate');
        if (translations[lang][key]) {
            element.textContent = translations[lang][key];
        }
    });
}

// Listen for language changes to update dynamic content
document.addEventListener('languageChanged', (event) => {
    const lang = event.detail.language;
    
    // Update document title
    const titleKey = document.title.split(' - ')[0];
    if (translations[lang][titleKey.toLowerCase()]) {
        document.title = `${translations[lang][titleKey.toLowerCase()]} - Whiff & Wonder`;
    }

    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription && translations[lang].welcomeMessage) {
        metaDescription.content = translations[lang].welcomeMessage;
    }
});
