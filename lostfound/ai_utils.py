import math
from collections import Counter


# ── Stop words (same as sklearn's English list, condensed) ──
STOP_WORDS = {
    "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "is", "was", "are", "were", "be", "been",
    "has", "have", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "it", "its", "this", "that", "these", "those",
    "i", "my", "me", "we", "our", "you", "your", "he", "she", "they", "their",
    "not", "no", "so", "if", "as", "up", "out", "about", "into", "than",
    "then", "just", "also", "more", "some", "any", "all", "when", "which"
}


def tokenize(text):
    """Lowercase, split, remove stop words and short tokens."""
    tokens = text.lower().split()
    return [
        t.strip(".,!?;:'\"()[]") for t in tokens
        if t.strip(".,!?;:'\"()[]") not in STOP_WORDS
        and len(t.strip(".,!?;:'\"()[]")) > 1
    ]


def compute_tf(tokens):
    """Term frequency for a list of tokens."""
    count = Counter(tokens)
    total = len(tokens) if tokens else 1
    return {term: freq / total for term, freq in count.items()}


def compute_idf(documents):
    """Inverse document frequency across all documents."""
    n = len(documents)
    idf = {}
    all_terms = set(term for doc in documents for term in doc)
    for term in all_terms:
        doc_count = sum(1 for doc in documents if term in doc)
        idf[term] = math.log((n + 1) / (doc_count + 1)) + 1  # smoothed
    return idf


def compute_tfidf_vector(tf, idf):
    """Multiply TF by IDF to get TF-IDF vector."""
    return {term: tf_val * idf.get(term, 0) for term, tf_val in tf.items()}


def cosine_sim(vec_a, vec_b):
    """Cosine similarity between two TF-IDF dicts."""
    all_terms = set(vec_a) | set(vec_b)
    dot   = sum(vec_a.get(t, 0) * vec_b.get(t, 0) for t in all_terms)
    mag_a = math.sqrt(sum(v ** 2 for v in vec_a.values()))
    mag_b = math.sqrt(sum(v ** 2 for v in vec_b.values()))
    if mag_a == 0 or mag_b == 0:
        return 0.0
    return dot / (mag_a * mag_b)


def compute_similarities(target_text, candidate_texts):
    """
    Replaces sklearn's TfidfVectorizer + cosine_similarity.
    Returns a list of similarity scores (floats) between
    target_text and each text in candidate_texts.
    """
    if not candidate_texts:
        return []

    all_texts   = [target_text] + candidate_texts
    tokenized   = [tokenize(t) for t in all_texts]
    idf         = compute_idf(tokenized)
    tfidf_vecs  = [compute_tfidf_vector(compute_tf(tok), idf) for tok in tokenized]

    target_vec  = tfidf_vecs[0]
    similarities = [cosine_sim(target_vec, vec) for vec in tfidf_vecs[1:]]

    return similarities


def calculate_score(target, candidate, text_similarity):
    """Unchanged — same logic as before."""
    score   = 0.0
    reasons = []

    if target.category == candidate.category:
        score += 0.3
        reasons.append("Same category")

    if target.location.lower() == candidate.location.lower():
        score += 0.2
        reasons.append("Same location")

    score += text_similarity * 0.5
    if text_similarity > 0.4:
        reasons.append("Similar description")

    return min(score, 1.0), ", ".join(reasons)

