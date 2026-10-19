/* ENCIMA Roofdeck menu data (Phase 1 seed, from the official PDF).
   Each item: name, desc (rewritten, concise), price, tags, photos[], review status.
   price: number | {glass, bottle} | {shot, bottle} | {glass200, bottle} | null (placeholder)
   review: "not_reviewed" | "reviewed" | "approved" | "for_revision"
   Translations: item.i18n = { fil:{name,desc}, zh:{...}, ... } (falls back to English). */

const I = (name, desc, price, tags = [], photos = [], extra = {}) =>
  ({ name, desc, price, tags, photos, review: "not_reviewed", status: "published", ...extra });

const MENU = {
  groups: [
    { id: "food", label: "Food" },
    { id: "drinks", label: "Drinks" },
    { id: "setmenu", label: "Set Menu" }
  ],
  sections: [
    /* ---------- FOOD ---------- */
    { id: "starters", group: "food", tone: "slate", name: "Starters", items: [
      I("Fried Calamares", "Crispy breaded squid rings served with chipotle aioli.", 350, ["seafood"], ["fried-calamares"]),
      I("Gambas al Ajillo", "Fresh shrimp sizzled in garlic, hot paprika, olive oil and a splash of rum. Served with toasted baguette.", 430, ["best", "seafood"]),
      I("Baby Squid in Garlic Oil", "Tender baby squid cooked in chili garlic oil and rum, served with sliced baguette.", 380, ["seafood", "spicy"]),
      I("Elotes", "Grilled sweet corn brushed with creamy, tangy Mexican crema and topped with red onion, paprika, jalapeño, cilantro and cotija cheese.", 290),
      I("Crispy Shrimp Roll", "Shrimp dumpling wrapped in shredded dumpling skin, fried golden and served with chipotle garlic aioli.", 360, ["seafood"]),
      I("Nacho Suprema", "Nacho chips piled with minced beef, pico de gallo, corn, beans, cheese sauce, chipotle garlic aioli and BBQ sauce.", 450, ["best", "share"]),
      I("Chili Cheese Fries", "Golden fries layered with hearty chili con carne, tomato, onion, melted cheese, jalapeño, BBQ sauce and garlic aioli.", 460),
      I("Sizzling Spicy Chorizo", "Garlicky, tangy Vigan chorizo sizzled in garlic oil, chili and paprika. Served with toast.", 380),
      I("Tuna Ceviche", "Grade A yellowfin tuna \"cooked\" in citrus with red onion, cilantro, jalapeño, ginger, cherry tomato, chili and ripe mango. Served with crispy wonton chips.", 480, ["seafood"])
    ]},
    { id: "salads", group: "food", tone: "slate", name: "Salads", items: [
      I("Ensalada Grande", "Mixed greens with corn, beans, cucumber, tomato, onion, fried chicken chunks, grated cheese and crispy tortilla strips. Honey mustard dressing.", 440),
      I("Caesar Salad", "Crisp romaine, garlic croutons, cherry tomato and parmesan in Caesar dressing, topped with grilled chicken.", 450, [], ["caesar-salad"]),
      I("Harvest Kale & Haloumi Salad", "Mixed greens and kale with honeycrisp apple, walnut, grilled halloumi and parmesan in a lemon vinaigrette.", 420)
    ]},
    { id: "especiales", group: "food", tone: "orange", name: "Especiales", items: [
      I("USDA Angus T-Bone Steak 21 oz", "Over half a kilo of Angus T-bone cooked to your preferred doneness. Served with house fried rice and crispy fries.", 3800, ["best", "share"]),
      I("USDA Hanging Tender Steak", "7 oz butcher's steak served with creamy truffle mashed potato, grilled tomato and green beans.", 1700, ["best", "share"]),
      I("Steak Paella", "7 oz USDA hanging tender steak over paella rice with beef bone marrow, green beans and tomatoes.", 1400, ["best"]),
      I("Smoked Babyback Ribs", "Tender pork back ribs glazed in smoky BBQ sauce. Served with truffle fries and coleslaw.", 1300, ["pork", "share"]),
      I("Paella Negra", "Squid-ink paella rice topped with baby squid, shrimp, green beans and tomatoes.", 750, ["seafood", "share"]),
      I("Pan-Seared Salmon", "Skin-on salmon fillet seared to perfection, served with a tossed quinoa salad of tomato, cucumber, red onion and lettuce in lemon dressing.", 720, ["seafood"]),
      I("Mexican Short Rib", "Beef short ribs slow-braised in Mexican spices. Served with truffle mashed potato and green beans.", 700, ["share"]),
      I("Pan-Fried Barramundi", "Crisp golden Asian sea bass served over grilled corn succotash with white beans, onion and pepper.", 680),
      I("Grilled Porkchop", "Grilled double pork chop glazed in smoky BBQ sauce. Served with Mexican fried rice and mango salsa.", 650, ["pork"], ["grilled-porkchop"]),
      I("Arroz con Pollo", "Mexican-spiced roasted half chicken served over paella rice.", 640, ["best", "share", "spicy"], ["arroz-con-pollo"]),
      I("Herb Fried Chicken", "Crispy fried chicken with mashed potato, gravy, and buttered corn and carrots.", 600, ["share"])
    ]},
    { id: "pasta", group: "food", tone: "slate", name: "Pasta", items: [
      I("Shrimp Scampi", "Fresh shrimp in white wine and butter with cherry tomato, basil and chili flakes, finished with fried garlic and parmesan. Served with garlic bread.", 570, ["seafood", "spicy"], ["shrimp-scampi"]),
      I("Squid Ink Seafood Pasta", "Shrimp, squid, clams and mussels in rich marinara tossed with squid-ink spaghetti. Served with garlic bread.", 540, ["seafood"]),
      I("Puttanesca", "Spaghetti with garlic, anchovies, tomato, basil, capers and chili flakes, topped with parmesan. Served with garlic bread.", 450),
      I("Pan-Seared Scallop", "Seared scallop and broccoli in creamy Alfredo over linguine. Served with garlic bread.", 520, ["seafood"]),
      I("Spicy Sausage Ragu", "Spicy Italian sausage and minced beef in rich tomato sauce, topped with ricotta and parmesan. Served with garlic bread.", 550, ["pork", "spicy"]),
      I("Truffle Mushroom", "Button and shiitake mushrooms in a creamy white wine sauce over linguine, finished with truffle oil and parmesan. Served with garlic bread.", 480, ["best"]),
      I("Grilled Chicken Pesto", "Spaghetti in fresh pesto cream sauce with grilled chicken fillet and pico de gallo. Served with garlic bread.", 520),
      I("BBQ Brisket Mac & Cheese", "Elbow macaroni in rich homemade cheese sauce, topped with slow-cooked BBQ beef brisket.", 580),
      I("Beef Lasagna", "Layers of pasta, minced beef and béchamel, baked with mozzarella and parmesan. Served with garlic bread.", 550, [], ["beef-lasagna"])
    ]},
    { id: "pizza", group: "food", tone: "slate", name: "Pizza", note: "8 slices per 12-inch pizza", items: [
      I("Texmex BBQ", "Smoked BBQ chicken, onion, bell pepper and corn on pizza sauce and mozzarella, drizzled with chipotle garlic aioli and BBQ sauce.", 720, ["best"]),
      I("Hawaiian Bacon", "Pizza sauce, mozzarella, smoked bacon, pineapple and bell pepper.", 720, ["pork"]),
      I("Suprema", "Pizza sauce, mozzarella, minced beef, sweet ham, pepperoni, olives, onion, mushroom, pineapple, bell pepper and parmesan.", 780, ["pork"]),
      I("Margherita", "Pizza sauce, mozzarella, roasted tomato, fresh basil and parmesan.", 650, ["veg"], ["margherita-pizza"]),
      I("Pepperoni", "Pizza sauce, mozzarella, pepperoni and parmesan.", 720, ["pork", "spicy"]),
      I("The White House", "Classic four-cheese pizza on béchamel, served with a side of pomodoro sauce.", 680, ["best"]),
      I("Cheeseburger Pizza", "All the flavor of a classic cheeseburger on a crispy pizza crust.", 750),
      I("Mushroom Bacon Rolliza", "Paper-thin pizza dough with truffle paste, parmesan, mozzarella, smoked bacon, arugula and micro greens. Served with hot honey.", 530, ["pork"]),
      I("Kani Rolliza", "Paper-thin pizza dough with Japanese mayo, parmesan, mozzarella, Japanese corn, kani, nori, red onion and bonito flakes. Served with hot honey.", 450, ["seafood"])
    ]},
    { id: "naked-burrito", group: "food", tone: "slate", name: "Naked Burrito", note: "All the goodness of a classic burrito, served without the tortilla wrap", items: [
      I("Beef Naked Burrito", "Beef with all the classic burrito fillings, no tortilla.", 480),
      I("Chicken Naked Burrito", "Chicken with all the classic burrito fillings, no tortilla.", 420),
      I("Shrimp Naked Burrito", "Shrimp with all the classic burrito fillings, no tortilla.", 540, ["seafood"])
    ]},
    { id: "tacos", group: "food", tone: "slate", name: "Tacos | Burritos | Sandwiches", items: [
      I("Beef Birria Taco", "Slow-braised beef, onion, cilantro and mozzarella in flour tortillas. Served with beef consommé and fries.", 440, ["spicy"]),
      I("Chicken Quesadilla", "Grilled marinated chicken and cheese in a flour tortilla. Served with pico de gallo.", 410, ["best"], ["chicken-quesadilla"]),
      I("Beef Quesadilla", "Taco-seasoned minced beef and cheese in a flour tortilla. Served with pico de gallo.", 410, ["best"]),
      I("Shrimp Quesadilla", "Crisp baby shrimp, onion, bell pepper and cheese in a flour tortilla. Served with salsa rojo, guacamole and truffle fries.", 520, ["seafood"]),
      I("Club Sandwich", "Three layers of chicken, egg, ham, bacon, cheese, lettuce, tomato and cucumber. Served with truffle fries.", 575, ["pork", "share"]),
      I("Grilled Cheese Sandwich", "Wheat bread with American and mozzarella cheese. Served with tomato soup and truffle fries.", 380, ["veg", "best"]),
      I("Buffalo Chicken Burger", "Crispy chicken thigh in buffalo sauce on a soft homemade bun with lettuce and pickles. Served with truffle fries and coleslaw.", 430, ["spicy"]),
      I("Cheeseburger", "Grilled beef patties with lettuce, tomato, onion, pickles, ketchup and mustard on a homemade bun. Served with truffle fries.", 460, ["best"], ["cheese-burger"]),
      I("Chicken Burrito", "Grilled marinated chicken wrapped in tortilla with Mexican fried rice, refried beans, guacamole and cheese. Served with pico de gallo and truffle fries.", 400),
      I("Beef Burrito", "Taco-seasoned beef wrapped in tortilla with Mexican fried rice, refried beans, guacamole and cheese. Served with pico de gallo and truffle fries.", 460),
      I("Beef Barbacoa Taco", "Slow-cooked shredded beef in smoky dried chiles and Mexican spices on homemade corn tortilla, with pico de gallo, guacamole and fries.", 420),
      I("Pollo Asado Taco", "Grilled marinated chicken on homemade corn tortilla with pico de gallo, guacamole and fries.", 400),
      I("Shrimp Taco", "Grilled shrimp with grilled corn salsa on homemade corn tortilla. Served with salsa rojo, guacamole and fries.", 560, ["seafood"])
    ]},
    { id: "dessert", group: "food", tone: "slate", name: "Dessert", items: [
      I("Brownies Ala Mode", "Moist, gooey walnut brownie with vanilla ice cream, chocolate sauce and a cherry on top.", 270, ["best", "share"]),
      I("Burnt Basque Cheesecake", "Baked crustless cheesecake with blueberry coulis.", 350, ["best", "share"], ["burnt-basque-cheesecake"]),
      I("Strawberry Panna Cotta", "Silky vanilla panna cotta with strawberry.", 290),
      I("Pistachio Tres Leches Cake", "Moist sponge soaked in three milks with whipped cream, chopped pistachio and dulce de leche.", 290, ["share"]),
      I("Vanilla Ice Cream", "A scoop of vanilla ice cream with chocolate sauce and a cherry.", 160),
      I("Tiramisu", "Timeless no-bake classic: coffee-soaked ladyfingers layered with mascarpone and cocoa.", 320)
    ]},
    { id: "sides", group: "food", tone: "slate", name: "Sides", items: [
      I("Mexican Fried Rice", "Fried rice with tomato, corn, beans, chorizo and cilantro, topped with pico de gallo.", 100),
      I("Cheesy Mashed Potato", "Buttery mashed potato with mozzarella and truffle oil.", 120),
      I("Mix Buttered Vegetables", "Broccoli, cauliflower, carrot, sayote and green beans in garlic butter.", 150, [], ["mix-buttered-vegetables"]),
      I("Flour Tortilla", "Three grilled flour tortillas.", 90),
      I("Buttered Corn and Carrots", "Corn and carrots in seasoned butter.", 90),
      I("Plain Rice", "Steamed jasmine rice.", 60),
      I("Garlic Fried Rice", "Garlicky fried rice.", 70),
      I("Nacho Chips and Dip", "Nacho chips with cheese sauce.", 120),
      I("Truffle French Fries", "Skin-on fries tossed in parmesan, truffle dust and truffle oil.", 270)
    ]},

    /* ---------- DRINKS ---------- */
    { id: "wines-red", group: "drinks", tone: "slate", name: "Red Wines", items: [
      I("Suntana Cabernet Sauvignon", "2024 · Chile · 12.5% ABV. Round and bold with black pepper and roasted hazelnut.", { glass: 360, bottle: 1500 }, [], [], { pairing: "Grilled meats, smoked meats, hard-aged cheese" }),
      I("Lupo Tre di Tre Salasso", "2022 · Italy · 14.5% ABV. Intense, jammy red fruits with strong, powerful tannins.", { bottle: 1900 }, ["vegan"], [], { pairing: "Fried or fatty meats" }),
      I("Maia Primitivo", "2022 · Italy · 13.5% ABV. Velvety, round tannins, dried figs and a smooth finish.", { bottle: 1900 }, ["organic"], [], { pairing: "Meat-heavy pizza, spiced beef stews" }),
      I("Boschi Barbera d'Asti", "2021 · Italy · 13.5% ABV. Fresh mature red fruit, cherry and currant with soft tannins and vibrant acidity. Medium to full-bodied.", { bottle: 1900 }, [], [], { pairing: "Rich meat dishes, cream-based pastas" }),
      I("Suntana Carmenere", "2023 · Chile · 12.5% ABV. Bold black pepper with velvety, round tannins and roasted hazelnut.", { bottle: 1700 }, [], [], { pairing: "Grilled meats, smoked meats, hard-aged cheese" }),
      I("Clos Montblanc Castell Tempranillo", "2023 · Spain · 14% ABV. Juicy red fruits and subtle spice with silky tannins. Full-bodied.", { bottle: 1900 }, [], [], { pairing: "Meat-topped pizza, steak, gambas" })
    ]},
    { id: "wines-white", group: "drinks", tone: "slate", name: "White Wines", items: [
      I("Casa Defrà Chardonnay", "2022 · Italy · 12% ABV. Dry and savory with notes of bread crust. Full-bodied, medium acidity.", { glass: 360, bottle: 1500 }, ["vegan"], [], { pairing: "Cream-based pasta, creamy chicken, rich seafood" }),
      I("Maia Pinot Grigio", "2022 · Italy · 12% ABV. Pleasantly fresh and floral, balanced acidity, medium body.", { bottle: 1900 }, ["organic"], [], { pairing: "Seafood, salads" }),
      I("Suntana Sauvignon Blanc", "2024 · Chile · 12.5% ABV. Green apple and citrus, high acidity.", { bottle: 1600 }, [], [], { pairing: "Fresh dishes, salad" }),
      I("Lupo Uno di Uno Vermentino", "2023 · Italy · 12.5% ABV. Rich and mineral with an almondy finish. Structured body.", { bottle: 1900 }, ["vegan"], [], { pairing: "Seafood, herb-based pasta, grilled poultry" })
    ]},
    { id: "wines-sparkling", group: "drinks", tone: "slate", name: "Sparkling & Rosé", items: [
      I("Brilla Sparkling Prosecco DOC", "Italy · 11% ABV. Green apple with delicate bubbles, extra dry and gently crisp. Light body.", { glass200: 750, bottle: 2100 }, [], [], { pairing: "Appetizers, steamed bites, pizza" }),
      I("Brilla Sparkling Prosecco Rosé", "Millesimato 2023 · Italy · 11% ABV. Strawberry and orange zest with lively acidity.", { glass200: 750, bottle: 2100 }, [], [], { pairing: "Sushi, duck wrap, mushrooms" }),
      I("Ca' del Cino Sparkling Vino Frizzante", "Italy · 10.5% ABV. Sweet, floral and effervescent. Lean body.", { bottle: 1700 }, [], [], { pairing: "Asian fusion, spring rolls, dimsum" }),
      I("Casa Pinot Grigio Venezie Rosé", "2023 · Italy · 12% ABV. Delicate and fruity with balanced acidity. Rounded body.", { bottle: 1700 }, ["vegan"], [], { pairing: "Light seafood, noodle dishes, sashimi" }),
      I("Brilla Sparkling Moscato", "Italy · 7% ABV. Sweet and festive, floral and effervescent with soft acidity. Light body.", { bottle: 2100 }, [], [], { pairing: "Sweet rolls, fruit-based desserts, spiced curry" })
    ]},
    { id: "coffee", group: "drinks", tone: "slate", name: "Hot & Iced / Blended Coffee", items: [
      I("Vanilla Latte", "", 190), I("Long Black", "", 150), I("Spanish Latte", "", 190), I("Caramel Macchiato", "", 190),
      I("Espresso Macchiato", "", 150), I("Lungo", "", 150), I("Espresso con Panna", "", 150), I("Hot Chocolate", "", 120),
      I("Vanilla Coffee Gelato (Blended)", "", 200), I("Mescolato Caramel (Blended)", "", 190), I("Creamy Macchiato (Blended)", "", 200),
      I("Encima Coffee Gelato (Iced)", "", 180), I("Vanilla Iced Coffee (Iced)", "", 200), I("Latte Gelato (Iced)", "", 180),
      I("Cappuccino Cooler (Iced)", "", 180), I("Caramel Macchiato Gelato (Iced)", "", 220)
    ]},
    { id: "tea", group: "drinks", tone: "slate", name: "Hot Tea", items: [
      I("Earl Grey", "", 100), I("Peppermint", "", 100), I("English Breakfast", "", 100), I("Green Tea", "", 100),
      I("Chamomile", "", 100), I("Hot Calamansi", "", 120), I("Warm Lemon Tea", "", 100)
    ]},
    { id: "refreshers", group: "drinks", tone: "slate", name: "Refreshers", items: [
      I("Mango Shake", "", 230, ["veg"]), I("Pineapple Shake", "", 230, ["veg"]), I("Watermelon Shake", "", 200, ["veg"]),
      I("Encima Iced Tea", "", 190), I("Chocolate Smoothie", "", 250), I("Salted Caramel Smoothie", "", 250)
    ]},
    { id: "soda", group: "drinks", tone: "slate", name: "Soda & Water", items: [
      I("Evian Still Water", "", 190), I("Ginger Ale", "", 150), I("Tonic Water", "", 160), I("Soda Water", "", 180),
      I("Coke Regular", "", 120), I("Coke Zero", "", 130), I("Sprite", "", 130), I("Royal", "", 120)
    ]},
    { id: "cocktails-signature", group: "drinks", tone: "slate", name: "Signature Cocktails", items: [
      I("Encima Red Sangria", "", 390), I("Encima White Sangria", "", 390), I("Encima Margarita", "", 390),
      I("Encima Creamy Mescolato", "", 390), I("Melon Citrus Martini", "", 420), I("Melon Citrus Dream", "", 420)
    ]},
    { id: "cocktails-classic", group: "drinks", tone: "slate", name: "Classic Cocktails · all ₱390", items: [
      "Tequila Sunrise", "Gin Tonic", "Margarita Rocks", "Negroni", "Cuba Libre", "Classic Martini", "Vodka Watermelon",
      "Mango Margarita Rocks", "Manhattan", "Long Island", "Rum Sunset Cocktail", "Mojito", "Strawberry Passion Fruit Gin Tonic",
      "Daiquiri", "Strawberry Daiquiri", "Piña Colada", "Dry Martini", "Perfect Martini", "Tropical Cocktail"
    ].map(n => I(n, "", 390)) },
    { id: "cocktails-coffee", group: "drinks", tone: "slate", name: "Coffee-Infused Cocktails", items: [
      I("Espresso Martini", "", null), I("Irish Coffee", "", null), I("Mexican Coffee", "", null)
    ]},
    { id: "mocktails", group: "drinks", tone: "slate", name: "Mocktails", items: [
      I("Blueberry Bliss Float", "", 380), I("Vanilla Berry Swirl", "", 380)
    ]},
    { id: "beer", group: "drinks", tone: "slate", name: "Ice Cold Beer", items: [
      I("Tanduay Ice Vodka Lemonade", "", 190), I("San Miguel Light", "", 170), I("San Miguel Super Dry", "", 200),
      I("San Miguel Pale Pilsen", "", 170), I("Red Horse Stallion", "", 170), I("San Mig Apple", "", 170),
      I("Smirnoff Mule", "", 170), I("Corona", "", 280), I("Heineken", "", 280), I("Draft Beer", "", 200)
    ]},
    { id: "whiskey", group: "drinks", tone: "slate", name: "Whiskey", items: [
      I("Chivas Regal", "", { shot: 300, bottle: 4200 }), I("JW Black", "", { shot: 210, bottle: 3900, bottleNote: "700 ml" }),
      I("JW Red", "", { shot: 210, bottle: 3100, bottleNote: "700 ml" }), I("Jim Beam", "", { shot: 150, bottle: 2500, bottleNote: "750 ml" }),
      I("Jack Daniel's", "", { shot: 240, bottle: 3500, bottleNote: "700 ml" }), I("Maker's Mark", "", { shot: 240, bottle: 3500 }),
      I("Glenfiddich", "", { shot: 495, bottle: 6500 })
    ]},
    { id: "vodka", group: "drinks", tone: "slate", name: "Vodka", items: [
      I("Smirnoff Red", "", { shot: 130, bottle: 2400 }), I("Stolichnaya", "", { shot: 170, bottle: 2200 }),
      I("Absolut Citron", "", { shot: 200, bottle: 2800 }), I("Absolut Kurant", "", { shot: 200, bottle: 2800 }),
      I("Belvedere", "", { shot: 320, bottle: 6000 }), I("Absolut Blue", "", { shot: 170, bottle: 2800 }),
      I("Grey Goose", "", { shot: 430, bottle: 6500 })
    ]},
    { id: "tequila", group: "drinks", tone: "slate", name: "Tequila", items: [
      I("Jose Cuervo Gold", "", { shot: 185, bottle: 2800 }), I("Jose Cuervo White", "", { shot: 185, bottle: 3000 }),
      I("Patrón Gold", "", { shot: 450, bottle: 6500 }), I("Patrón White", "", { shot: 450, bottle: 6500 })
    ]},
    { id: "rum", group: "drinks", tone: "slate", name: "Rum", items: [
      I("Bacardi Gold", "", { shot: 120, bottle: 2500 }), I("Bacardi White", "", { shot: 120, bottle: 2500, bottleNote: "750 ml" })
    ]},
    { id: "gin", group: "drinks", tone: "slate", name: "Gin", items: [
      I("Zapiro", "", { shot: 100, bottle: 1400 }), I("Bombay Sapphire", "", { shot: 220, bottle: 3300 }),
      I("Tanqueray", "", { shot: 210, bottle: 3300 }), I("Zapiro Strawberry", "", { shot: 100, bottle: 1400 })
    ]},

    /* ---------- SET MENU ---------- */
    { id: "perfect-night", group: "setmenu", tone: "dark", name: "A Perfect Night for Two", note: "A romantic set menu experience", setmenu: true, items: [
      I("Set Menu for Two", "", null, [], ["set-menu-hero"], { courses: [
        { title: "Appetizers", choice: false, options: ["Encima House Salad", "Creamy Potato Leek Soup"] },
        { title: "Main Courses", choice: true, options: ["Grilled Hanging Tender Steak", "Bacon-Wrapped Pork Tenderloin", "Pan-Seared Salmon Fillet"] },
        { title: "Dessert (choose two)", choice: false, options: ["Brownies Ala Mode", "Raspberry Red Wine Sorbet"] }
      ]})
    ]}
  ]
};

const TAGS = {
  best:    { label: "Best Seller", icon: "★" },
  spicy:   { label: "Spicy", icon: "🌶" },
  veg:     { label: "Vegetarian", icon: "🌿" },
  pork:    { label: "Contains Pork", icon: "🐖" },
  seafood: { label: "Seafood", icon: "🐚" },
  peanut:  { label: "Contains Peanuts", icon: "🥜" },
  share:   { label: "Good for Sharing", icon: "👥" },
  organic: { label: "Organic", icon: "🍃" },
  vegan:   { label: "Vegan-Certified", icon: "🌱" }
};

const SITE = {
  hours: "7:00 AM – 12:00 AM",
  phone: "+63 (0)00 000 0000",
  email: "email@placeholder.com",
  address: "23rd Floor (SP), City Garden Hotel Makati, Makati Ave. corner Durban St., Makati City 7870",
  opentable: "https://www.opentable.com.au/r/encima-roofdeck-restaurant-makati-reservations-makati-city?restref=327572&lang=en-AU&ot_source=Restaurant%20website&ot_campaign=digital_menu",
  social: { facebook: "#", instagram: "#", tiktok: "#" }
};

/* ---- Banner blocks: sections that share one banner (drinks are grouped) ---- */
const BLOCKS = {
  "wines-red": "wines", "wines-white": "wines", "wines-sparkling": "wines",
  "coffee": "coffee-tea", "tea": "coffee-tea",
  "refreshers": "soft", "soda": "soft",
  "cocktails-signature": "cocktails", "cocktails-classic": "cocktails", "cocktails-coffee": "cocktails", "mocktails": "cocktails",
  "beer": "beer",
  "whiskey": "spirits", "vodka": "spirits", "tequila": "spirits", "rum": "spirits", "gin": "spirits"
};
const BLOCK_NAMES = { wines: "Wines", "coffee-tea": "Coffee & Tea", soft: "Refreshers, Soda & Water", cocktails: "Cocktails & Mocktails", beer: "Ice Cold Beer", spirits: "Spirits" };
