const translations = {
    en: {
        home: "Home",
        collections: "Collections",
        aboutUs: "About Us",
        contact: "Contact"
    },
    ro: {
        home: "Acasă",
        collections: "Colecții",
        aboutUs: "Despre Noi",
        contact: "Contact"
    }
};

function translatePage(lang) {
    const elements = document.querySelectorAll('[data-translate]');
    elements.forEach(element => {
        const key = element.getAttribute('data-translate');
        if (translations[lang] && translations[lang][key]) {
            element.textContent = translations[lang][key];
        }
    });
}

// Initialize with English
document.addEventListener('DOMContentLoaded', () => translatePage('en'));
