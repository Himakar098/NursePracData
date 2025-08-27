import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime

# 1. Load the data
def load_poem_data(file_path):
    """Load POEM data from CSV file."""
    df = pd.read_csv(file_path)
    print(f"Data loaded: {df.shape[0]} rows and {df.shape[1]} columns")
    return df

# 2. Data cleaning and preparation
def clean_poem_data(df):
    """Clean and prepare POEM data for analysis."""
    # Make a copy to avoid modifying the original
    cleaned_df = df.copy()
    
    # Drop unnamed or empty columns
    unnamed_cols = [col for col in cleaned_df.columns if 'Unnamed' in col]
    cleaned_df = cleaned_df.drop(columns=unnamed_cols)
    
    # Check for missing values in key columns
    print(f"Missing values in key columns:")
    print(cleaned_df[['Patient ID', 'Gender', 'V_Total']].isna().sum())
    
    # Convert date columns to datetime where possible
    date_columns = [col for col in cleaned_df.columns if 'Date' in col]
    for col in date_columns:
        try:
            # Try to convert, but keep original if fails
            cleaned_df[col] = pd.to_datetime(cleaned_df[col], errors='coerce')
        except:
            print(f"Could not convert {col} to datetime")
    
    return cleaned_df

# 3. Basic statistics and overview
def generate_basic_stats(df):
    """Generate basic statistics for POEM scores."""
    # Identify all Total score columns
    total_cols = [col for col in df.columns if 'Total' in col]
    
    # Calculate statistics for each visit's total score
    stats = df[total_cols].describe().T
    
    # Add completion rate (non-null values %)
    stats['completion_rate'] = (df[total_cols].notna().mean() * 100).values
    
    print("\nPOEM Score Statistics:")
    return stats

# 4. Analyze score trends over visits
def analyze_visit_trends(df):
    """Analyze how POEM scores change across visits."""
    total_cols = [col for col in df.columns if 'Total' in col and col != 'V_Total']
    
    # Calculate mean scores for each visit
    mean_scores = df[['V_Total'] + total_cols].mean().reset_index()
    mean_scores.columns = ['Visit', 'Mean_Score']
    
    # Extract visit number from column names
    mean_scores['Visit_Num'] = mean_scores['Visit'].apply(
        lambda x: int(x.split('_')[0].replace('V', '')) if 'V' in x else 1
    )
    
    # Sort by visit number
    mean_scores = mean_scores.sort_values('Visit_Num')
    
    return mean_scores

# 5. Gender-based analysis
def analyze_by_gender(df):
    """Compare POEM scores between genders."""
    gender_stats = df.groupby('Gender')['V_Total'].agg(['mean', 'std', 'count'])
    return gender_stats

# 6. Visualize score distributions
def visualize_score_distribution(df):
    """Create visualizations for POEM score distributions."""
    plt.figure(figsize=(12, 8))
    
    # First visit total score distribution
    plt.subplot(2, 2, 1)
    sns.histplot(df['V_Total'].dropna(), kde=True)
    plt.title('Distribution of Initial POEM Scores')
    plt.xlabel('POEM Score')
    
    # Create boxplot of scores by visit
    plt.subplot(2, 2, 2)
    total_cols = [col for col in df.columns if 'Total' in col]
    score_data = df[total_cols].copy()
    # Rename columns for better readability
    score_data.columns = [f"Visit {i+1}" if i > 0 else "Initial" 
                         for i, col in enumerate(total_cols)]
    score_df = pd.melt(score_data)
    sns.boxplot(x='variable', y='value', data=score_df)
    plt.title('POEM Scores by Visit')
    plt.xlabel('Visit')
    plt.ylabel('POEM Score')
    plt.xticks(rotation=45)
    
    # Gender comparison
    plt.subplot(2, 2, 3)
    sns.boxplot(x='Gender', y='V_Total', data=df)
    plt.title('POEM Scores by Gender')
    
    plt.tight_layout()
    plt.savefig('poem_score_analysis.png')
    plt.close()
    
    return "Visualization saved as poem_score_analysis.png"

# 7. Analyze improvement over time (for patients with multiple visits)
def analyze_improvement(df):
    """Analyze how patients' scores improve over subsequent visits."""
    # Get initial visit and follow-up visit columns
    visit_pairs = [('V_Total', 'V2_Total'), 
                  ('V2_Total', 'V3_Total'),
                  ('V3_Total', 'V4_Total')]
    
    improvement_stats = []
    
    for first, second in visit_pairs:
        # Get patients with both visits
        both_visits = df.dropna(subset=[first, second])
        
        if len(both_visits) > 0:
            # Calculate improvement
            both_visits['change'] = both_visits[first] - both_visits[second]
            both_visits['pct_improvement'] = (both_visits['change'] / both_visits[first]) * 100
            
            # Categorize: improved, same, worse
            both_visits['outcome'] = both_visits['change'].apply(
                lambda x: 'Improved' if x > 0 else ('Same' if x == 0 else 'Worse')
            )
            
            # Calculate stats
            stats = {
                'visit_transition': f"{first} to {second}",
                'num_patients': len(both_visits),
                'mean_change': both_visits['change'].mean(),
                'mean_pct_improvement': both_visits['pct_improvement'].mean(),
                'improved_count': (both_visits['outcome'] == 'Improved').sum(),
                'same_count': (both_visits['outcome'] == 'Same').sum(),
                'worse_count': (both_visits['outcome'] == 'Worse').sum(),
            }
            improvement_stats.append(stats)
    
    return pd.DataFrame(improvement_stats)

# 8. Question-level analysis (which symptoms improve most)
def analyze_questions(df):
    """Analyze which specific symptoms (questions) improve most over time."""
    # Identify all Q1, Q2, etc. across visits
    q_cols = {}
    for i in range(1, 8):  # 7 questions
        q_cols[f'Q{i}'] = [col for col in df.columns if f'Q{i}' in col]
    
    q_means = {}
    for q, cols in q_cols.items():
        # Calculate mean for each question across visits
        q_means[q] = [df[col].mean() for col in cols if df[col].notna().sum() > 0]
    
    return q_means

# 9. Main analysis function
def analyze_poem_data(file_path):
    """Main function to perform POEM data analysis."""
    # Load data
    df = load_poem_data(file_path)
    
    # Clean data
    clean_df = clean_poem_data(df)
    
    # Generate basic statistics
    basic_stats = generate_basic_stats(clean_df)
    print(basic_stats)
    
    # Analyze visit trends
    visit_trends = analyze_visit_trends(clean_df)
    print("\nVisit Trends (Mean Scores):")
    print(visit_trends)
    
    # Gender analysis
    gender_stats = analyze_by_gender(clean_df)
    print("\nGender Analysis:")
    print(gender_stats)
    
    # Visualize data
    viz_result = visualize_score_distribution(clean_df)
    print(f"\n{viz_result}")
    
    # Improvement analysis
    improvement_stats = analyze_improvement(clean_df)
    print("\nImprovement Analysis:")
    print(improvement_stats)
    
    # Question analysis
    q_means = analyze_questions(clean_df)
    print("\nQuestion-Level Analysis (Mean Scores by Visit):")
    for q, means in q_means.items():
        print(f"{q}: {means}")
    
    return {
        'clean_data': clean_df,
        'basic_stats': basic_stats,
        'visit_trends': visit_trends,
        'gender_stats': gender_stats,
        'improvement_stats': improvement_stats,
        'question_means': q_means
    }

# Run the analysis
if __name__ == "__main__":
    results = analyze_poem_data("POEMdataentrysheet2017_2023_csv.csv")
    
    # Export clean data for Power BI if needed
    results['clean_data'].to_csv("clean_poem_data.csv", index=False)
    print("\nCleaned data exported to 'clean_poem_data.csv' for Power BI analysis")