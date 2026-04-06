import streamlit as st
import requests
from textblob import TextBlob
import pandas as pd

# 1. Page Configuration
st.set_page_config(page_title="NLP News Sentiment Tracker", layout="wide", page_icon="📰")

# 2. Sidebar for User Interaction
st.sidebar.header("🔍 Search Parameters")
topic = st.sidebar.text_input("Enter Topic (e.g., Bitcoin, AI, India)", "Technology")
page_size = st.sidebar.slider("Number of Articles", 5, 20, 10)

# Your Private API Key
API_KEY = 'e498d5588bbd436dad8f27d92f985723'

st.title("🤖 NLP News Sentiment & Source Analyzer")
st.markdown(f"Currently analyzing live trends for: **{topic}**")

# 3. Main Logic
if st.sidebar.button('Run Analysis'):
    with st.spinner('Fetching live news and running NLP models...'):
        # Fetching Data from NewsAPI
        url = f'https://newsapi.org/v2/everything?q={topic}&apiKey={API_KEY}&pageSize={page_size}'
        response = requests.get(url).json()
        articles = response.get('articles', [])

        if articles:
            processed_data = []
            for art in articles:
                # TextBlob Sentiment Analysis
                text_to_analyze = art['title']
                analysis = TextBlob(text_to_analyze)
                polarity = analysis.sentiment.polarity
                
                # Categorization Logic
                if polarity > 0.1:
                    sentiment = "Positive"
                elif polarity < -0.1:
                    sentiment = "Negative"
                else:
                    sentiment = "Neutral"

                processed_data.append({
                    "Source": art['source']['name'],
                    "Headline": text_to_analyze,
                    "Sentiment": sentiment,
                    "Polarity": round(polarity, 2),
                    "Article Link": art['url'] # Metadata for traceability
                })

            # Convert to DataFrame
            df = pd.DataFrame(processed_data)

            # 4. Display Results in Two Columns
            col1, col2 = st.columns([2, 1])

            with col1:
                st.subheader("📊 Sentiment Data Table")
                # Making the URL clickable using column_config
                st.dataframe(
                    df,
                    column_config={
                        "Article Link": st.column_config.LinkColumn("View Source")
                    },
                    hide_index=True,
                    use_container_width=True
                )

            with col2:
                st.subheader("📈 Sentiment Distribution")
                sentiment_counts = df['Sentiment'].value_counts()
                st.bar_chart(sentiment_counts)
                
                st.subheader("📝 Summary Statistics")
                st.write(f"**Total Articles:** {len(df)}")
                st.write(f"**Avg Polarity:** {df['Polarity'].mean():.2f}")

        else:
            st.error("No news found. Try a broader keyword or check your API limit.")

else:
    st.info("Click 'Run Analysis' in the sidebar to start fetching data.")
