from flask import Flask, render_template, request
import requests
from textblob import TextBlob

app = Flask(__name__)

API_KEY = 'e498d5588bbd436dad8f27d92f985723'

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

                blob = TextBlob(title)
                score = blob.sentiment.polarity

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
                    'source': art['source']['name'],
                    'url': art['url'],
                    'sentiment': sentiment,
                    'score': round(score, 2)
                })

    return render_template(
        'index.html',
        results=news_results,
        topic=search_topic,
        positive=positive,
        negative=negative,
        neutral=neutral
    )

if __name__ == '__main__':
    app.run(debug=True)