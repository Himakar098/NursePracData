// MyAuthApp/data/healthTipsSchema.js
// Schema for health tips in Firestore

const healthTipsSchema = {
    // Collection: healthTips
    
    // Document: tip_eczema_1
    tipEczema1: {
      id: "tip_eczema_1",
      condition: "eczema",
      title: "Moisturize Regularly",
      content: "Apply moisturizer at least twice a day to keep your child's skin hydrated. Use fragrance-free, hypoallergenic moisturizers that are specifically formulated for sensitive skin.",
      category: "skincare",
      tags: ["moisturizer", "daily care", "prevention"]
    },
    
    // Document: tip_eczema_2
    tipEczema2: {
      id: "tip_eczema_2",
      condition: "eczema",
      title: "Bathing Best Practices",
      content: "Use lukewarm water for baths (not hot), limit bath time to 10-15 minutes, and use gentle, fragrance-free cleansers. Pat the skin dry instead of rubbing, and apply moisturizer within 3 minutes after bathing.",
      category: "bathing",
      tags: ["bathing", "daily care", "prevention"]
    },
    
    // Document: tip_eczema_3
    tipEczema3: {
      id: "tip_eczema_3",
      condition: "eczema",
      title: "Clothing Considerations",
      content: "Dress your child in loose-fitting, cotton clothing. Avoid wool, polyester, and other synthetic fabrics that can irritate the skin. Always wash new clothes before wearing to remove potential irritants.",
      category: "clothing",
      tags: ["fabrics", "irritants", "prevention"]
    },
    
    // Document: tip_eczema_4
    tipEczema4: {
      id: "tip_eczema_4",
      condition: "eczema",
      title: "Managing Flare-Ups",
      content: "During a flare-up, increase moisturizing frequency and apply prescribed medications as directed. Keep fingernails short to minimize damage from scratching, and consider cotton gloves at night.",
      category: "treatment",
      tags: ["flare-up", "management", "scratching"]
    },
    
    // Document: tip_eczema_5
    tipEczema5: {
      id: "tip_eczema_5",
      condition: "eczema",
      title: "Environmental Controls",
      content: "Keep your home cool and humidity at 45-55%. Use a vacuum with a HEPA filter, and wash bedding weekly in hot water with fragrance-free detergent. Consider dust mite covers for mattresses and pillows.",
      category: "environment",
      tags: ["dust mites", "allergens", "home"]
    },
    
    // Document: tip_obesity_1
    tipObesity1: {
      id: "tip_obesity_1",
      condition: "obesity",
      title: "Healthy Snack Options",
      content: "Replace processed snacks with fresh fruits, vegetable sticks with hummus, yogurt, or a small handful of nuts. Keep these ready-to-eat in the refrigerator for easy access.",
      category: "nutrition",
      tags: ["snacks", "healthy eating", "food choice"]
    },
    
    // Document: tip_obesity_2
    tipObesity2: {
      id: "tip_obesity_2",
      condition: "obesity",
      title: "Physical Activity Ideas",
      content: "Aim for at least 60 minutes of physical activity daily. This can be broken into smaller segments throughout the day. Consider family walks, bike rides, swimming, or active play at parks.",
      category: "exercise",
      tags: ["activity", "exercise", "family"]
    },
    
    // Document: tip_obesity_3
    tipObesity3: {
      id: "tip_obesity_3",
      condition: "obesity",
      title: "Limiting Screen Time",
      content: "Reduce sedentary behavior by setting limits on TV, video games, tablets, and phones. Create screen-free zones in the home, especially in bedrooms and at the dinner table.",
      category: "lifestyle",
      tags: ["screen time", "sedentary", "habits"]
    },
    
    // Document: tip_obesity_4
    tipObesity4: {
      id: "tip_obesity_4",
      condition: "obesity",
      title: "Family Meals Matter",
      content: "Regularly eat meals together as a family without distractions like TV. Focus on conversation and eating slowly. This promotes better food choices and prevents overeating.",
      category: "nutrition",
      tags: ["family meals", "eating habits", "portion control"]
    },
    
    // Document: tip_obesity_5
    tipObesity5: {
      id: "tip_obesity_5",
      condition: "obesity",
      title: "Reading Food Labels",
      content: "Teach your child to read and understand food labels. Look for hidden sugars, portion sizes, and ingredients. Choose foods with fewer ingredients and less added sugar.",
      category: "nutrition",
      tags: ["food labels", "sugar", "education"]
    },
    
    // Document: tip_general_1
    tipGeneral1: {
      id: "tip_general_1",
      condition: "general",
      title: "Sleep Importance",
      content: "Ensure your child gets adequate sleep for their age. Establish a regular bedtime routine, maintain consistent sleep/wake times, and create a comfortable sleep environment.",
      category: "sleep",
      tags: ["sleep", "routine", "health"]
    },
    
    // Document: tip_general_2
    tipGeneral2: {
      id: "tip_general_2",
      condition: "general",
      title: "Hydration Habits",
      content: "Encourage your child to drink plenty of water throughout the day. Limit sugary drinks, including juice. Consider a reusable water bottle they can carry with them.",
      category: "nutrition",
      tags: ["water", "hydration", "drinks"]
    },
    
    // Document: tip_general_3
    tipGeneral3: {
      id: "tip_general_3",
      condition: "general",
      title: "Hand Washing",
      content: "Teach proper hand washing techniques - use soap, warm water, and wash for at least 20 seconds, especially before meals and after using the restroom. This helps prevent illness and infection.",
      category: "hygiene",
      tags: ["hand washing", "germs", "prevention"]
    }
  };
  
  // Example of a single health tip document structure
  const healthTipExample = {
    id: "tip_id", // Unique identifier
    condition: "eczema", // Which condition this tip is for (eczema, obesity, general)
    title: "Tip Title", // Short, descriptive title
    content: "Detailed content of the health tip with specific advice",
    category: "category", // E.g., skincare, nutrition, exercise, etc.
    tags: ["keyword1", "keyword2"], // Keywords for searching/filtering
    createdAt: "timestamp", // When the tip was added to the database
    image: "url", // Optional image URL to illustrate the tip
    source: "Source attribution if applicable" // Optional reference source
  };
  
  export default healthTipsSchema;