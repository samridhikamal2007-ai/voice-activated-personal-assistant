import requests
import xml.etree.ElementTree as ET
import html
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

NEWS_FEEDS = {
    "general": "https://feeds.bbci.co.uk/news/rss.xml",
    "technology": "https://feeds.bbci.co.uk/news/technology/rss.xml",
    "science": "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml",
    "business": "https://feeds.bbci.co.uk/news/business/rss.xml"
}

def clean_text(text: str) -> str:
    """Helper to unescape HTML characters and clean whitespace."""
    if not text:
        return ""
    # Decode html entities like &quot;, &amp;
    text = html.unescape(text)
    # Strip any residual HTML tag markers (BBC descriptions sometimes have formatting)
    text = text.replace("<p>", "").replace("</p>", "").replace("<br/>", "")
    return " ".join(text.split())

def get_news(category: str = "general", limit: int = 5) -> dict:
    """
    Fetches latest stories from the specified RSS feed category.
    Returns a dictionary with news items.
    """
    category = category.lower().strip()
    if category not in NEWS_FEEDS:
        category = "general"

    feed_url = NEWS_FEEDS[category]
    logger.info(f"Fetching news for category '{category}' from feed: {feed_url}")

    try:
        response = requests.get(feed_url, timeout=5, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        })
        response.raise_for_status()

        # Parse XML
        root = ET.fromstring(response.content)
        items = root.findall(".//item")
        
        articles = []
        for item in items[:limit]:
            title = item.find("title")
            description = item.find("description")
            link = item.find("link")
            pub_date = item.find("pubDate")

            title_text = clean_text(title.text) if title is not None else "No Title"
            desc_text = clean_text(description.text) if description is not None else "No description available."
            link_text = link.text.strip() if link is not None else "#"
            date_text = pub_date.text.strip() if pub_date is not None else ""
            
            # Formulate a simplified summary for text-to-speech to read cleanly
            tts_summary = f"{title_text}. {desc_text}"

            articles.append({
                "title": title_text,
                "description": desc_text,
                "link": link_text,
                "published": date_text,
                "tts_summary": tts_summary
            })

        return {
            "success": True,
            "category": category,
            "articles": articles
        }

    except requests.exceptions.RequestException as e:
        logger.error(f"Network error fetching news RSS: {e}")
        return {"error": "News service is currently offline. Please check your internet connection."}
    except ET.ParseError as e:
        logger.error(f"XML Parsing error for RSS feed: {e}")
        return {"error": "Failed to parse news feeds format."}
    except Exception as e:
        logger.error(f"Unexpected error in news service: {e}")
        return {"error": "An unexpected error occurred while compiling news headlines."}

# Quick test routine if run directly
if __name__ == "__main__":
    result = get_news("technology")
    print(result)
