from flask import Flask, render_template, request, jsonify
import requests
from textblob import TextBlob, Word
from datetime import datetime
import json

app = Flask(__name__)

API_KEY = 'e498d5588bbd436dad8f27d92f985723'

def analyze_sentiment_detailed(text):
    """
    Perform detailed sentiment analysis on text
    Returns sentiment data including word-by-word analysis
    """
    blob = TextBlob(text)
    polarity = blob.sentiment.polarity
    
    sentences = blob.sentences
    word_sentiments = []
    
    for word in blob.words:
        word_lower = word.lower()
        word_blob = TextBlob(word_lower)
        word_polarity = word_blob.sentiment.polarity
        
        if word_polarity != 0:
            word_sentiments.append({
                'word': word_lower,
                'polarity': round(word_polarity, 2),
                'type': 'positive' if word_polarity > 0 else 'negative'
            })
    
    word_sentiments.sort(key=lambda x: abs(x['polarity']), reverse=True)
    
    positive_words = [w for w in word_sentiments if w['type'] == 'positive']
    negative_words = [w for w in word_sentiments if w['type'] == 'negative']
    
    return {
        'polarity': round(polarity, 2),
        'word_sentiments': word_sentiments,
        'positive_words': positive_words,
        'negative_words': negative_words,
        'total_sentiment_words': len(word_sentiments),
        'subjectivity': round(blob.sentiment.subjectivity, 2)
    }

#flask app routes

@app.route('/', methods=['GET', 'POST'])
def index():
    news_results = []
    search_topic = ""

    positive = 0
    negative = 0
    neutral = 0

    if request.method == 'POST':
        search_topic = request.form.get('topic')

        if search_topic:
            url = f'https://newsapi.org/v2/everything?q={search_topic}&apiKey={API_KEY}&pageSize=10'
            response = requests.get(url).json()
            articles = response.get('articles', [])

            for art in articles:
                title = art.get('title', 'No Title')
                description = art.get('description', '')
                content = art.get('content', '')
                
                full_text = f"{title}. {description}".strip()
                if description == '':
                    full_text = title
                
                published_at = art.get('publishedAt', '')
                if published_at:
                    try:
                        date_obj = datetime.strptime(published_at, '%Y-%m-%dT%H:%M:%SZ')
                        formatted_date = date_obj.strftime('%b %d, %Y')
                    except:
                        formatted_date = published_at[:10]
                else:
                    formatted_date = "Unknown"

                blob = TextBlob(title)
                score = blob.sentiment.polarity
                
                detailed_analysis = analyze_sentiment_detailed(full_text)

                if score > 0.1:
                    sentiment = "Positive"
                    positive += 1
                elif score < -0.1:
                    sentiment = "Negative"
                    negative += 1
                else:
                    sentiment = "Neutral"
                    neutral += 1

                news_results.append({
                    'title': title,
                    'description': description,
                    'source': art['source']['name'],
                    'url': art['url'],
                    'sentiment': sentiment,
                    'score': round(score, 2),
                    'publishedAt': formatted_date,
                    'detailed_analysis': detailed_analysis,
                    'full_text': full_text
                })

    return render_template(
        'index.html',
        results=news_results,
        topic=search_topic,
        positive=positive,
        negative=negative,
        neutral=neutral
    )

@app.route('/analyze/<int:article_id>', methods=['POST'])
def analyze_article(article_id):
    """
    API endpoint to get detailed analysis of an article
    """
    data = request.get_json()
    text = data.get('text', '')
    
    if not text:
        return jsonify({'error': 'No text provided'}), 400
    
    analysis = analyze_sentiment_detailed(text)
    return jsonify(analysis)


@app.route('/load-more', methods=['POST'])
def load_more():
    """Fetch the next page of articles for a topic"""
    data = request.get_json()
    topic = data.get('topic', '')
    page = data.get('page', 2)

    if not topic:
        return jsonify({'error': 'No topic provided'}), 400

    url = f'https://newsapi.org/v2/everything?q={topic}&apiKey={API_KEY}&pageSize=10&page={page}'
    response = requests.get(url).json()
    articles = response.get('articles', [])

    results = []
    for art in articles:
        title = art.get('title', 'No Title')
        description = art.get('description', '')
        full_text = f"{title}. {description}".strip() if description else title

        published_at = art.get('publishedAt', '')
        if published_at:
            try:
                date_obj = datetime.strptime(published_at, '%Y-%m-%dT%H:%M:%SZ')
                formatted_date = date_obj.strftime('%b %d, %Y')
            except:
                formatted_date = published_at[:10]
        else:
            formatted_date = 'Unknown'

        blob = TextBlob(title)
        score = blob.sentiment.polarity
        detailed_analysis = analyze_sentiment_detailed(full_text)

        if score > 0.1:
            sentiment = 'Positive'
        elif score < -0.1:
            sentiment = 'Negative'
        else:
            sentiment = 'Neutral'

        results.append({
            'title': title,
            'description': description,
            'source': art['source']['name'],
            'url': art['url'],
            'sentiment': sentiment,
            'score': round(score, 2),
            'publishedAt': formatted_date,
            'detailed_analysis': detailed_analysis,
        })

    total_results = response.get('totalResults', 0)
    has_more = (page * 10) < min(total_results, 100)  

    return jsonify({'articles': results, 'has_more': has_more, 'page': page})

if __name__ == '__main__':
    app.run(debug=True)