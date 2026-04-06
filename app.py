import streamlit as st
import requests
from textblob import TextBlob
import pandas as pd

# App Title
st.title("NLP News Sentiment Tracker")

# Sidebar for User Input
topic = st.sidebar.text_input("Enter Topic (e.g., Bitcoin, AI, Tesla)", "Technology")
api_key = 'e498d5588bbd436dad8f27d92f985723'

if st.button('Analyze Sentiment'):
    # 1. Fetch News
    url = f'https://newsapi.org/v2/everything?q={topic}&apiKey={api_key}&pageSize=10'
    response = requests.get(url).json()
    
    articles = response.get('articles', [])
    
    if articles:
        data = []
        for art in articles:
            # 2. NLP Analysis
            analysis = TextBlob(art['title'])
            score = analysis.sentiment.polarity
            label = "Positive" if score > 0 else "Negative" if score < 0 else "Neutral"
            
            data.append({"Headline": art['title'], "Sentiment": label, "Score": score})
        
        # 3. Display Results
        df = pd.DataFrame(data)
        st.write(f"Showing sentiment for: **{topic}**")
        st.dataframe(df)
        
        # 4. Visualization
        st.bar_chart(df['Sentiment'].value_counts())
    else:
        st.error("No articles found or API error.")
