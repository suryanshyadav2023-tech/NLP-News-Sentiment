// DOM Elements
const searchForm = document.getElementById('searchForm');
const topicInput = document.getElementById('topicInput');
const searchBtn = document.getElementById('searchBtn');

// Modal Elements
const analysisModal = document.getElementById('analysisModal');
const modalClose = document.querySelector('.modal-close');
const modalCloseBtn = document.querySelector('.modal-close-btn');

let sentimentChart = null;
let sourceChart = null;

// Handle form submission
searchForm.addEventListener('submit', async (e) => {
    // Allow form to submit normally to Flask backend
    const topic = topicInput.value.trim();

    if (!topic) {
        e.preventDefault();
        alert('Please enter a topic');
        return;
    }

    // Show loading state
    searchBtn.disabled = true;
    searchBtn.textContent = 'Searching...';

    // Let form submit naturally (Flask will handle it)
    // Re-enable button after a delay (will be replaced by page reload anyway)
    setTimeout(() => {
        searchBtn.disabled = false;
        searchBtn.textContent = 'Search & Analyze';
    }, 3000);
});

// Modal Functions
function openAnalysisModal(title, sentiment, score, articleUrl, detailedAnalysis) {
    // Set title
    document.getElementById('modalTitle').textContent = title;
    
    // Set sentiment badge
    const sentimentBadge = document.getElementById('modalSentimentBadge');
    sentimentBadge.className = `modal-sentiment-badge ${sentiment.toLowerCase()}`;
    sentimentBadge.textContent = sentiment;
    
    // Set score
    document.getElementById('modalScore').textContent = score;
    
    // Set subjectivity
    document.getElementById('modalSubjectivity').textContent = detailedAnalysis.subjectivity;
    
    // Set classification explanation
    let classification = '';
    if (sentiment === 'Positive') {
        classification = '✅ Positive Sentiment (Score > 0.1)';
    } else if (sentiment === 'Negative') {
        classification = '❌ Negative Sentiment (Score < -0.1)';
    } else {
        classification = '➖ Neutral Sentiment (Score between -0.1 and 0.1)';
    }
    document.getElementById('modalClassification').textContent = classification;
    
    // Display positive keywords
    const positiveKeywordsList = document.getElementById('positiveKeywordsList');
    positiveKeywordsList.innerHTML = '';
    if (detailedAnalysis.positive_words.length > 0) {
        detailedAnalysis.positive_words.forEach(word => {
            const tag = document.createElement('div');
            tag.className = 'keyword-tag positive';
            tag.innerHTML = `<span>${word.word}</span><span class="keyword-score">${word.polarity > 0 ? '+' : ''}${word.polarity}</span>`;
            positiveKeywordsList.appendChild(tag);
        });
    } else {
        positiveKeywordsList.innerHTML = '<p style="color: var(--text-muted); font-size: 12px;">No positive keywords found</p>';
    }
    document.getElementById('positiveWordCount').textContent = detailedAnalysis.positive_words.length;
    document.getElementById('positiveWordMetric').textContent = detailedAnalysis.positive_words.length;
    
    // Display negative keywords
    const negativeKeywordsList = document.getElementById('negativeKeywordsList');
    negativeKeywordsList.innerHTML = '';
    if (detailedAnalysis.negative_words.length > 0) {
        detailedAnalysis.negative_words.forEach(word => {
            const tag = document.createElement('div');
            tag.className = 'keyword-tag negative';
            tag.innerHTML = `<span>${word.word}</span><span class="keyword-score">${word.polarity}</span>`;
            negativeKeywordsList.appendChild(tag);
        });
    } else {
        negativeKeywordsList.innerHTML = '<p style="color: var(--text-muted); font-size: 12px;">No negative keywords found</p>';
    }
    document.getElementById('negativeWordCount').textContent = detailedAnalysis.negative_words.length;
    document.getElementById('negativeWordMetric').textContent = detailedAnalysis.negative_words.length;
    
    // Set calculation explanation
    const totalWords = detailedAnalysis.total_sentiment_words;
    const posCount = detailedAnalysis.positive_words.length;
    const negCount = detailedAnalysis.negative_words.length;
    const wordBalance = posCount - negCount;
    
    let calculationText = `Found <strong>${totalWords}</strong> sentiment-bearing words in the article. `;
    calculationText += `<strong>${posCount}</strong> positive keywords and <strong>${negCount}</strong> negative keywords were identified. `;
    calculationText += `The final polarity score of <strong>${score}</strong> represents the average sentiment of all these words combined.`;
    document.getElementById('calculationExplanation').innerHTML = calculationText;
    
    // Set word balance
    document.getElementById('wordBalance').textContent = wordBalance > 0 ? `+${wordBalance} (More Positive)` : wordBalance < 0 ? `${wordBalance} (More Negative)` : `0 (Balanced)`;
    document.getElementById('totalSentimentWords').textContent = totalWords;
    
    // Set sentiment explanation
    let explanation = '';
    if (sentiment === 'Positive') {
        explanation = `<strong>Why Positive?</strong> The article contains more positive sentiment words (${posCount}) than negative (${negCount}). Words like "${detailedAnalysis.positive_words.slice(0, 2).map(w => w.word).join('", "')}" contributed to the positive classification.`;
    } else if (sentiment === 'Negative') {
        explanation = `<strong>Why Negative?</strong> The article contains more negative sentiment words (${negCount}) than positive (${posCount}). Words like "${detailedAnalysis.negative_words.slice(0, 2).map(w => w.word).join('", "')}" contributed to the negative classification.`;
    } else {
        explanation = `<strong>Why Neutral?</strong> The article has a balanced mix of sentiment words with a score between -0.1 and 0.1. Both positive (${posCount}) and negative (${negCount}) keywords are present, resulting in a neutral overall sentiment.`;
    }
    document.getElementById('sentimentExplanation').innerHTML = explanation;
    
    // Set read link
    document.getElementById('modalReadLink').href = articleUrl;
    
    // Show modal
    analysisModal.classList.add('show');
    document.body.style.overflow = 'hidden'; // Prevent background scroll
}

function closeAnalysisModal() {
    analysisModal.classList.remove('show');
    document.body.style.overflow = 'auto'; // Re-enable scroll
}

// Modal event listeners
modalClose.addEventListener('click', closeAnalysisModal);
modalCloseBtn.addEventListener('click', closeAnalysisModal);

// Close modal when clicking outside of it
window.addEventListener('click', function(event) {
    if (event.target === analysisModal) {
        closeAnalysisModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeAnalysisModal();
    }
});

// Function to initialize sentiment distribution chart
function initSentimentChart(positive, neutral, negative) {
    const ctx = document.getElementById('sentimentChart');
    if (!ctx) return;

    // Destroy existing chart if it exists
    if (sentimentChart) {
        sentimentChart.destroy();
    }

    sentimentChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Positive', 'Neutral', 'Negative'],
            datasets: [{
                data: [positive, neutral, negative],
                backgroundColor: [
                    '#92d050',  // Positive - light green
                    '#7c8aa0',  // Neutral - gray
                    '#ff6b6b'   // Negative - red
                ],
                borderColor: [
                    'rgba(146, 208, 80, 0.2)',
                    'rgba(124, 138, 160, 0.2)',
                    'rgba(255, 107, 107, 0.2)'
                ],
                borderWidth: 2,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#e0e0e0',
                        font: {
                            size: 13,
                            weight: '500'
                        },
                        padding: 15,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(26, 31, 46, 0.9)',
                    titleColor: '#ffffff',
                    bodyColor: '#e0e0e0',
                    borderColor: '#2a3142',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Function to initialize source sentiment chart
function initSourceChart(articles) {
    const ctx = document.getElementById('sourceChart');
    if (!ctx) return;

    // Destroy existing chart if it exists
    if (sourceChart) {
        sourceChart.destroy();
    }

    // Group articles by source and sentiment
    const sourceData = {};
    articles.forEach(article => {
        const source = article.source.substring(0, 15); // Shorten source name
        if (!sourceData[source]) {
            sourceData[source] = { positive: 0, neutral: 0, negative: 0 };
        }
        
        if (article.sentiment === 'Positive') sourceData[source].positive++;
        else if (article.sentiment === 'Negative') sourceData[source].negative++;
        else sourceData[source].neutral++;
    });

    const sources = Object.keys(sourceData);
    const positive = sources.map(s => sourceData[s].positive);
    const neutral = sources.map(s => sourceData[s].neutral);
    const negative = sources.map(s => sourceData[s].negative);

    sourceChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sources,
            datasets: [
                {
                    label: 'Positive',
                    data: positive,
                    backgroundColor: '#92d050',
                    borderColor: 'rgba(146, 208, 80, 0.3)',
                    borderWidth: 1,
                    borderRadius: 6
                },
                {
                    label: 'Neutral',
                    data: neutral,
                    backgroundColor: '#7c8aa0',
                    borderColor: 'rgba(124, 138, 160, 0.3)',
                    borderWidth: 1,
                    borderRadius: 6
                },
                {
                    label: 'Negative',
                    data: negative,
                    backgroundColor: '#ff6b6b',
                    borderColor: 'rgba(255, 107, 107, 0.3)',
                    borderWidth: 1,
                    borderRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#e0e0e0',
                        font: {
                            size: 13,
                            weight: '500'
                        },
                        padding: 15,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(26, 31, 46, 0.9)',
                    titleColor: '#ffffff',
                    bodyColor: '#e0e0e0',
                    borderColor: '#2a3142',
                    borderWidth: 1,
                    padding: 12
                }
            },
            scales: {
                x: {
                    stacked: true,
                    grid: {
                        color: 'rgba(42, 49, 66, 0.3)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#a0a0a0',
                        font: {
                            size: 12
                        }
                    }
                },
                y: {
                    stacked: true,
                    grid: {
                        color: 'rgba(42, 49, 66, 0.3)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#a0a0a0',
                        font: {
                            size: 12
                        }
                    }
                }
            }
        }
    });
}


// Update both charts with newly loaded articles
function updateCharts(newArticles) {
    // Re-read all cards currently in the DOM (original + loaded)
    const allCards = document.querySelectorAll('.news-card');
    let positive = 0, neutral = 0, negative = 0;
    const allArticles = [];

    allCards.forEach(card => {
        const sentiment = card.querySelector('.sentiment-badge').textContent.trim();
        const source = card.querySelector('.source-badge').textContent.trim();
        if (sentiment === 'Positive') positive++;
        else if (sentiment === 'Negative') negative++;
        else neutral++;
        allArticles.push({ sentiment, source });
    });

    // Update stat cards
    const posEl = document.getElementById('positiveCount');
    const neuEl = document.getElementById('neutralCount');
    const negEl = document.getElementById('negativeCount');
    if (posEl) posEl.textContent = positive;
    if (neuEl) neuEl.textContent = neutral;
    if (negEl) negEl.textContent = negative;

    // Rebuild both charts from scratch with full data
    initSentimentChart(positive, neutral, negative);
    initSourceChart(allArticles);
}

// Scroll to results if they exist
document.addEventListener('DOMContentLoaded', function() {
    const resultsSection = document.getElementById('resultsSection');
    const statsSection = document.getElementById('statsSection');
    const chartSection = document.getElementById('chartSection');
    
    if (resultsSection || statsSection) {
        // Delay scroll slightly to let page render
        setTimeout(() => {
            if (statsSection) {
                statsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 500);

        // Initialize charts if data exists
        if (chartSection) {
            const positive = document.getElementById('positiveCount').textContent;
            const neutral = document.getElementById('neutralCount').textContent;
            const negative = document.getElementById('negativeCount').textContent;

            initSentimentChart(parseInt(positive), parseInt(neutral), parseInt(negative));

            // Collect article data for source chart
            const articles = [];
            document.querySelectorAll('.news-card').forEach(card => {
                const title = card.querySelector('.news-title').textContent;
                const source = card.querySelector('.source-badge').textContent;
                const sentimentBadge = card.querySelector('.sentiment-badge');
                const sentiment = sentimentBadge.textContent.trim();

                articles.push({ title, source, sentiment });
            });

            if (articles.length > 0) {
                initSourceChart(articles);
            }
        }
    }

    // Init Load More button if results are present
    const loadMoreContainer = document.getElementById('loadMoreContainer');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    const searchTopicEl = document.getElementById('searchTopic');

    if (loadMoreContainer && searchTopicEl) {
        currentTopic = searchTopicEl.textContent.trim();
        currentPage = 1;
        loadMoreContainer.style.display = 'flex';
        document.getElementById('loadMoreInfo').textContent = 'Showing 10 articles';
        loadMoreBtn.addEventListener('click', loadMoreArticles);
    }

    // Attach click handlers to analyze buttons
    document.querySelectorAll('.analyze-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const title = this.dataset.title;
            const sentiment = this.dataset.sentiment;
            const score = this.dataset.score;
            const detailedAnalysis = this.dataset.analysis ? JSON.parse(this.dataset.analysis) : {};
            
            // Find the article card to get the URL
            const card = this.closest('.news-card');
            const articleUrl = card.querySelector('a.read-btn').href;
            
            openAnalysisModal(title, sentiment, score, articleUrl, detailedAnalysis);
        });
    });
});

// Add smooth scroll behavior for any anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// Add keyboard shortcut (Ctrl/Cmd + Enter to search)
document.addEventListener('keydown', function(event) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        if (topicInput === document.activeElement) {
            searchForm.submit();
        }
    }
});

// Add animation to stat cards when page loads with results
window.addEventListener('load', function() {
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        setTimeout(() => {
            card.style.transition = 'all 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });

    const newsCards = document.querySelectorAll('.news-card');
    newsCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        setTimeout(() => {
            card.style.transition = 'all 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 50);
    });
});

// ── Load More ──────────────────────────────────────────────────────────────

let currentPage = 1;
let currentTopic = '';
let isLoadingMore = false;

function createArticleCard(article) {
    const sentimentLower = article.sentiment.toLowerCase();
    const card = document.createElement('article');
    card.className = `news-card ${sentimentLower}`;

    const analysisJson = JSON.stringify(article.detailed_analysis).replace(/'/g, "&#39;");

    card.innerHTML = `
        <div class="card-header">
            <h3 class="news-title">${article.title}</h3>
            <div style="display: flex; gap: 8px; flex-direction: column;">
                <span class="sentiment-badge ${sentimentLower}">${article.sentiment}</span>
                <span class="sentiment-score">Score: ${article.score}</span>
            </div>
        </div>
        <div class="card-meta">
            <div class="meta-left">
                <span class="source-badge">${article.source}</span>
                <span class="date-badge">📅 ${article.publishedAt}</span>
            </div>
            <div class="action-buttons">
                <button class="analyze-btn"
                    data-title="${article.title.replace(/"/g, '&quot;')}"
                    data-sentiment="${article.sentiment}"
                    data-score="${article.score}"
                    data-analysis='${JSON.stringify(article.detailed_analysis)}'>
                    🔍 Analyze
                </button>
                <a href="${article.url}" target="_blank" rel="noopener noreferrer" class="read-btn">Read Full Article →</a>
            </div>
        </div>`;

    // Attach analyze button listener
    card.querySelector('.analyze-btn').addEventListener('click', function () {
        const title = this.dataset.title;
        const sentiment = this.dataset.sentiment;
        const score = this.dataset.score;
        const detailedAnalysis = JSON.parse(this.dataset.analysis);
        const articleUrl = card.querySelector('a.read-btn').href;
        openAnalysisModal(title, sentiment, score, articleUrl, detailedAnalysis);
    });

    return card;
}

async function loadMoreArticles() {
    if (isLoadingMore) return;
    isLoadingMore = true;

    const btn = document.getElementById('loadMoreBtn');
    const btnText = document.getElementById('loadMoreText');
    btnText.textContent = 'Loading...';
    btn.disabled = true;

    try {
        const nextPage = currentPage + 1;
        const res = await fetch('/load-more', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ topic: currentTopic, page: nextPage })
        });

        const data = await res.json();

        if (data.articles && data.articles.length > 0) {
            const grid = document.getElementById('resultsGrid');

            data.articles.forEach((article, i) => {
                const card = createArticleCard(article);
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                grid.appendChild(card);
                setTimeout(() => {
                    card.style.transition = 'all 0.4s ease';
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, i * 60);
            });

            currentPage = nextPage;

            // Update total count badge
            const totalEl = document.getElementById('totalCount');
            if (totalEl) totalEl.textContent = parseInt(totalEl.textContent) + data.articles.length;

            // Rebuild charts to include new articles
            updateCharts(data.articles);

            // Show/hide button based on whether more pages exist
            if (!data.has_more) {
                document.getElementById('loadMoreContainer').style.display = 'none';
            } else {
                btnText.textContent = 'Load More Articles';
                btn.disabled = false;
                document.getElementById('loadMoreInfo').textContent =
                    `Showing ${currentPage * 10} articles`;
            }
        } else {
            document.getElementById('loadMoreContainer').style.display = 'none';
        }
    } catch (err) {
        console.error('Load more failed:', err);
        btnText.textContent = 'Load More Articles';
        btn.disabled = false;
    }

    isLoadingMore = false;
}