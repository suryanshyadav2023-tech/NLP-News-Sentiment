from flask import Flask, render_template, request
import requests
from textblob import TextBlob

app = Flask(__name__)

# Your NewsAPI Key
API_KEY = 'e498d5588bbd436dad8f27d92f985723'

@app.route('/', methods=['GET', 'POST'])
def index():
    news_results = []
    search_topic = ""
    
    if request.method == 'POST':
        search_topic = request.form.get('topic')
        if search_topic:
            # 1. Fetch News
            url = f'https://newsapi.org/v2/everything?q={search_topic}&apiKey={API_KEY}&pageSize=10'
            response = requests.get(url).json()
            articles = response.get('articles', [])

            # 2. NLP Processing
            for art in articles:
                text = art['title']
                blob = TextBlob(text)
                score = blob.sentiment.polarity
                
                # Classification
                if score > 0.1: sentiment = "Positive"
                elif score < -0.1: sentiment = "Negative"
                else: sentiment = "Neutral"

                news_results.append({
                    'title': text,
                    'source': art['source']['name'],
                    'url': art['url'],
                    'sentiment': sentiment,
                    'score': round(score, 2)
                })

    return render_template('index.html', results=news_results, topic=search_topic)

if __name__ == '__main__':
    app.run(debug=True)
