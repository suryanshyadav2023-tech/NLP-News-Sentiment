import streamlit as st
import requests
from textblob import TextBlob
import pandas as pd

# App Config
st.set_page_config(page_title="NLP News Analyzer", layout="wide")
st.title("📰 Real-Time News Sentiment & Source Tracker")

# Sidebar
st.sidebar.header("Settings")
topic = st.sidebar.text_input("Enter Topic", "Global Economy")
# Your API Key is now integrated
api_key = 'e498d5588bbd436dad8f27d92f985723'

if st.button('Analyze Live News'):
    # Fetching news with 'source' data
    url = f'https://newsapi.org/v2/everything?q={topic}&apiKey={api_key}&pageSize=15'
    response = requests.get(url).json()
    
    articles = response.get('articles', [])
    
    if articles:
        results = []
        for art in articles:
            # NLP Analysis
            analysis = TextBlob(art['title'])
            score = analysis.sentiment.polarity
            
            # Classification
            if score > 0.1: label = "Positive"
            elif score < -0.1: label = "Negative"
            else: label = "Neutral"
            
            results.append({
                "Source": art['source']['name'],  # <--- THIS confirms the real source
                "Headline": art['title'],
                "Sentiment": label,
                "Polarity Score": round(score, 2)
            })
        
        df = pd.DataFrame(results)
        
        # UI Layout
        col1, col2 = st.columns([2, 1])
        
        with col1:
            st.subheader(f"Latest News on '{topic}'")
            st.dataframe(df, use_container_width=True)
            
        with col2:
            st.subheader("Sentiment Distribution")
            st.bar_chart(df['Sentiment'].value_counts())
            
            st.subheader("Top Sources Found")
            st.write(df['Source'].unique()) # Shows the professor the verified outlets

    else:
        st.error("No articles found. Please try a different keyword or check your API limit.")
