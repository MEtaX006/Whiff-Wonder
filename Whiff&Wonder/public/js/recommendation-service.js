class RecommendationService {
    constructor() {
        this.productCache = null;
    }

    async getAllProducts() {
        if (this.productCache) {
            return this.productCache;
        }

        try {
            const response = await fetch('/data/items.json');
            if (!response.ok) {
                throw new Error('Failed to fetch products');
            }
            this.productCache = await response.json();
            return this.productCache;
        } catch (error) {
            console.error('Error loading products:', error);
            throw error;
        }
    }

    calculateSimilarity(product1, product2) {
        let score = 0;
        
        // Compare accords
        const commonAccords = product1.accords.filter(accord => 
            product2.accords.includes(accord));
        score += commonAccords.length * 2;
        
        // Compare notes
        const allNotes1 = [...product1.notes.top, ...product1.notes.heart, ...product1.notes.base];
        const allNotes2 = [...product2.notes.top, ...product2.notes.heart, ...product2.notes.base];
        const commonNotes = allNotes1.filter(note => allNotes2.includes(note));
        score += commonNotes.length;
        
        // Price range similarity (closer prices = higher score)
        const priceDiff = Math.abs(product1.price - product2.price);
        score += (1 - Math.min(priceDiff / 100, 1)) * 2;
        
        // Gender compatibility
        if (product1.gender === product2.gender || 
            product1.gender === 'unisex' || 
            product2.gender === 'unisex') {
            score += 1;
        }
        
        return score;
    }

    async getRecommendations(excludeIds = [], limit = 3) {
        try {
            const products = await this.getAllProducts();
            
            // Get user's likes if authenticated
            let userLikes = [];
            try {
                const likesResponse = await fetch('/api/user/likes', { 
                    credentials: 'include' 
                });
                if (likesResponse.ok) {
                    const data = await likesResponse.json();
                    if (data.success) {
                        userLikes = data.likes;
                    }
                }
            } catch (error) {
                console.warn('Error fetching user likes:', error);
            }

            // Get user's recent views
            let recentViews = [];
            try {
                const recentResponse = await fetch('/api/user/recent-views', {
                    credentials: 'include'
                });
                if (recentResponse.ok) {
                    const data = await recentResponse.json();
                    if (data.success) {
                        recentViews = data.recentViews;
                    }
                }
            } catch (error) {
                console.warn('Error fetching recent views:', error);
            }

            // Calculate recommendations based on likes and recent views
            const recommendations = new Map(); // productId -> score
            const referencedProducts = [...userLikes, ...recentViews].filter(id => !excludeIds.includes(id));

            if (referencedProducts.length === 0) {
                // If no user history, return top-rated products
                return products
                    .filter(p => !excludeIds.includes(p.id))
                    .sort((a, b) => b.rating - a.rating)
                    .slice(0, limit);
            }

            // Calculate similarity scores
            for (const refId of referencedProducts) {
                const refProduct = products.find(p => p.id === refId);
                if (!refProduct) continue;

                for (const candidate of products) {
                    if (excludeIds.includes(candidate.id) || referencedProducts.includes(candidate.id)) {
                        continue;
                    }

                    const similarity = this.calculateSimilarity(refProduct, candidate);
                    const currentScore = recommendations.get(candidate.id) || 0;
                    recommendations.set(candidate.id, currentScore + similarity);
                }
            }

            // Sort by score and return top recommendations
            return Array.from(recommendations.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, limit)
                .map(([id]) => products.find(p => p.id === id));

        } catch (error) {
            console.error('Error getting recommendations:', error);
            throw error;
        }
    }
}

// Initialize and expose the recommendation service
window.recommendationService = new RecommendationService();