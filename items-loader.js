document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('productContainer');

    try {
        const response = await fetch('http://localhost:3000/api/products');
        if (!response.ok) {
            throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
        
        const items = await response.json();

        items.forEach(item => {
            const productDiv = document.createElement('div');
            productDiv.className = 'product';

            productDiv.innerHTML = `
                <img src="${item.image}" alt="${item.name}">
                <h3>${item.name}</h3>
                <div class="perfume-details">
                    <div class="notes">
                        <h4 data-translate="mainAccords">Main Accords</h4>
                        ${item.accords.map(accord => `<span class="accord">${accord}</span>`).join('')}
                    </div>
                    <div class="rating">
                        <span class="stars">★★★★☆</span>
                        <span class="score">${item.rating}</span>
                    </div>
                    <div class="notes-pyramid">
                        <p><strong data-translate="topNotes">Top Notes:</strong> ${item.notes.top.join(', ')}</p>
                        <p><strong data-translate="heartNotes">Heart Notes:</strong> ${item.notes.heart.join(', ')}</p>
                        <p><strong data-translate="baseNotes">Base Notes:</strong> ${item.notes.base.join(', ')}</p>
                    </div>
                </div>
                <button onclick="window.location.href='product-details.html?id=${item.id}'" data-translate="fullReview">Full Review</button>
            `;

            container.appendChild(productDiv);
        });
    } catch (error) {
        console.error('Error loading items:', error);
        container.innerHTML = '<div style="text-align: center; padding: 2rem;"><h2>Error loading products</h2><p>Please try again later</p></div>';
    }
});
