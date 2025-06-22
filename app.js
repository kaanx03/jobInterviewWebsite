// GENMAR Ürün Kataloğu - Basit ve Hatasız Versiyon
// Çalışma amaçlı tasarlanmış temiz kod

// Global değişkenler
var products = [];
var studyQuestions = [];
var categories = {};
var language = "tr";
var filteredItems = [];
var studyMode = "browse";
var currentQuestionIndex = 0;
var currentFlashcardIndex = 0;
var studyStats = {
  viewedProducts: new Set(),
  favorites: new Set(),
  quizScore: 0,
  totalQuizzes: 0,
};

// HTML elementleri
var searchBox, langButton, productGrid, noResultsDiv, statsDiv, productCount;
var studyModeButtons = {};
var progressBar;

// Sayfa yüklendiğinde başlat
document.addEventListener("DOMContentLoaded", function () {
  startApp();
});

function startApp() {
  getElements();
  showLoadingMessage();
  loadData();
  addEventListeners();
  createStudyControls();
}

function getElements() {
  searchBox = document.getElementById("searchInput");
  langButton = document.getElementById("langToggle");
  productGrid = document.getElementById("productsContainer");
  noResultsDiv = document.getElementById("noResults");
  statsDiv = document.getElementById("stats");
  productCount = document.getElementById("totalProducts");
}

function createStudyControls() {
  var header = document.querySelector(".header");
  if (!header) return;

  var studyControlsHTML =
    '<div class="study-controls">' +
    '<div class="study-modes">' +
    '<button id="browseBtn" class="study-mode-btn active">📚 Gözden Geçir</button>' +
    '<button id="quizBtn" class="study-mode-btn">🧠 Quiz</button>' +
    '<button id="questionBtn" class="study-mode-btn">❓ Sorular</button>' +
    '<button id="flashcardBtn" class="study-mode-btn">🎴 Flashcard</button>' +
    '<button id="favoritesBtn" class="study-mode-btn">⭐ Favoriler</button>' +
    "</div>" +
    '<div class="study-progress">' +
    '<div class="progress-info">' +
    '<span id="progressText">İlerleme: 0/0</span>' +
    '<span id="scoreText">Skor: 0%</span>' +
    "</div>" +
    '<div class="progress-bar-container">' +
    '<div id="progressBar" class="progress-bar"></div>' +
    "</div>" +
    "</div>" +
    "</div>";

  header.insertAdjacentHTML("beforeend", studyControlsHTML);

  // Buton referanslarını al
  studyModeButtons.browse = document.getElementById("browseBtn");
  studyModeButtons.quiz = document.getElementById("quizBtn");
  studyModeButtons.question = document.getElementById("questionBtn");
  studyModeButtons.flashcard = document.getElementById("flashcardBtn");
  studyModeButtons.favorites = document.getElementById("favoritesBtn");
  progressBar = document.getElementById("progressBar");

  addStudyEventListeners();
  updateProgressDisplay();
}

function showLoadingMessage() {
  if (productGrid) {
    productGrid.innerHTML =
      '<div class="loading">' +
      '<div class="loading-spinner"></div>' +
      "<h3>📦 Ürün bilgileri yükleniyor...</h3>" +
      "<p>Çalışma materyaliniz hazırlanıyor</p>" +
      "</div>";
  }
}

function loadData() {
  fetch("./products.json")
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      processData(data);
    })
    .catch(function (error) {
      loadSampleData();
    });
}

function processData(data) {
  products = [];
  for (var i = 0; i < data.products.length; i++) {
    var item = data.products[i];
    products.push({
      id: item.id || "product_" + i,
      titleTR: item.nameTR,
      titleEN: item.nameEN,
      featuresTR: item.featuresTR,
      featuresEN: item.featuresEN,
      detailsTR: item.detailsTR || "",
      detailsEN: item.detailsEN || "",
      category: item.category,
    });
  }

  studyQuestions = data.studyQuestions || [];
  categories = data.categories || {};
  filteredItems = products.slice();
  displayProducts();
  updateProgressDisplay();
}

function loadSampleData() {
  products = [
    {
      id: "1",
      titleTR: "Torkmetre ve Sıkma Sistemleri",
      titleEN: "Torque Meters & Fastening Systems",
      featuresTR:
        "Gerçek zamanlı tork kontrolü, yüksek hassasiyet, çoklu alet yönetimi, otomasyon entegrasyonu",
      featuresEN:
        "Real-time torque control, high precision, multi-tool management, automation integration",
      detailsTR:
        "Torkun ne olduğu, torkmetrenin çalışma prensibi ve kalibrasyonun üretim kalitesine etkisi önemlidir.",
      detailsEN:
        "Understanding torque, torque meter working principles and calibration effects on production quality are important.",
      category: "measurement",
    },
    {
      id: "2",
      titleTR: "Bataryalı El Aletleri",
      titleEN: "Cordless Power Tools",
      featuresTR:
        "Kablosuz, kompakt tasarım, dar alanlarda etkili kullanım, uzun pil ömrü",
      featuresEN:
        "Wireless, compact design, effective in tight spaces, long battery life",
      detailsTR:
        "Hassas montaj işlemlerinde kullanılan kablosuz aletler. Kompakt tasarım kritiktir.",
      detailsEN:
        "Cordless tools used in precision assembly operations. Compact design is critical.",
      category: "tools",
    },
  ];

  studyQuestions = [
    {
      id: "tech1",
      questionTR: "Tork sistemleri hakkında ne biliyorsunuz?",
      questionEN: "What do you know about torque systems?",
      answerTR:
        "Torkmetre sistemleri hassas sıkma sağlar. Montaj hattında kalibrasyonu üretim kalitesini etkiler.",
      answerEN:
        "Torque meter systems provide precise tightening. Calibration on assembly line affects production quality.",
      category: "Teknik Bilgi",
    },
  ];

  categories = {
    measurement: {
      nameTR: "Ölçüm ve Test",
      nameEN: "Measurement & Testing",
      color: "#3498db",
    },
    tools: { nameTR: "El Aletleri", nameEN: "Hand Tools", color: "#e74c3c" },
  };

  filteredItems = products.slice();
  displayProducts();
  updateProgressDisplay();
}

function searchProducts(searchText) {
  if (!searchText || searchText.trim() === "") {
    filteredItems =
      studyMode === "favorites"
        ? products.filter(function (p) {
            return studyStats.favorites.has(p.id);
          })
        : products.slice();
    return;
  }

  var term = searchText.toLowerCase();
  var searchPool =
    studyMode === "favorites"
      ? products.filter(function (p) {
          return studyStats.favorites.has(p.id);
        })
      : products;

  filteredItems = searchPool.filter(function (product) {
    return (
      product.titleTR.toLowerCase().indexOf(term) !== -1 ||
      product.titleEN.toLowerCase().indexOf(term) !== -1 ||
      product.featuresTR.toLowerCase().indexOf(term) !== -1 ||
      product.featuresEN.toLowerCase().indexOf(term) !== -1
    );
  });
}

function highlightSearchTerm(text, searchTerm) {
  if (!searchTerm || searchTerm.trim() === "") return text;

  var escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\");
  var regex = new RegExp("(" + escapedTerm + ")", "gi");
  return text.replace(regex, '<span class="highlight">$1</span>');
}

// ============ BURADA ÖNEMLİ DEĞİŞİKLİK! ============
function updateContainerClass() {
  if (!productGrid) return;

  // Grid yapısını kaldır ve doğru class'ı ver
  if (studyMode === "browse" || studyMode === "favorites") {
    // Normal grid modunda
    productGrid.className = "products-grid";
  } else {
    // Quiz, Sorular, Flashcard modlarında grid'i kaldır
    productGrid.className = "study-mode-container";
  }
}

function displayProducts() {
  if (!productGrid || !productCount || !statsDiv || !noResultsDiv) return;

  // Container class'ını güncelle
  updateContainerClass();

  updateStats();

  if (filteredItems.length === 0 && studyMode !== "question") {
    showNoResults();
    return;
  }

  hideNoResults();

  if (studyMode === "browse" || studyMode === "favorites") {
    renderProductCards();
  } else if (studyMode === "quiz") {
    renderQuizMode();
  } else if (studyMode === "question") {
    renderQuestionMode();
  } else if (studyMode === "flashcard") {
    renderFlashcardMode();
  }
}

function updateStats() {
  var count =
    studyMode === "question" ? studyQuestions.length : filteredItems.length;
  productCount.textContent = count;

  var text = "";
  if (studyMode === "favorites") {
    text = language === "tr" ? "favori ürün" : "favorite products";
  } else if (studyMode === "question") {
    text = language === "tr" ? "çalışma sorusu" : "study questions";
  } else {
    text = language === "tr" ? "ürün gösteriliyor" : "products showing";
  }

  statsDiv.innerHTML = "<strong>" + count + "</strong> " + text;
}

function showNoResults() {
  var message = "";
  if (studyMode === "favorites") {
    message =
      language === "tr"
        ? "<h3>⭐ Henüz favori ürün yok</h3><p>Ürünlerin üzerine tıklayarak favorilere ekleyin</p>"
        : "<h3>⭐ No favorite products yet</h3><p>Click on products to add them to favorites</p>";
  } else {
    message =
      language === "tr"
        ? "<h3>🔍 Ürün bulunamadı</h3><p>Arama kriterlerinizi değiştirip tekrar deneyin</p>"
        : "<h3>🔍 No products found</h3><p>Try changing your search criteria</p>";
  }

  productGrid.innerHTML =
    '<div class="no-results" style="display: block;">' + message + "</div>";
  noResultsDiv.classList.add("hidden");
}

function hideNoResults() {
  noResultsDiv.classList.add("hidden");
}

function renderProductCards() {
  var searchTerm = searchBox ? searchBox.value.toLowerCase().trim() : "";
  var cardsHTML = "";

  for (var i = 0; i < filteredItems.length; i++) {
    cardsHTML += createProductCard(filteredItems[i], searchTerm);
  }

  productGrid.innerHTML = cardsHTML;
  addProductCardEvents();
}

function createProductCard(product, searchTerm) {
  var isTurkish = language === "tr";
  var title = isTurkish ? product.titleTR : product.titleEN;
  var features = isTurkish ? product.featuresTR : product.featuresEN;
  var details = isTurkish ? product.detailsTR : product.detailsEN;
  var featuresLabel = isTurkish ? "Özellikler:" : "Features:";
  var detailsLabel = isTurkish ? "Detaylı Bilgi:" : "Detailed Info:";

  var highlightedTitle = highlightSearchTerm(title, searchTerm);
  var highlightedFeatures = highlightSearchTerm(features, searchTerm);
  var highlightedDetails = highlightSearchTerm(details, searchTerm);

  var categoryInfo = getCategoryInfo(product);
  var otherLanguageTitle = isTurkish ? product.titleEN : product.titleTR;
  var highlightedOtherTitle = highlightSearchTerm(
    otherLanguageTitle,
    searchTerm
  );

  var isFavorite = studyStats.favorites.has(product.id);
  var isViewed = studyStats.viewedProducts.has(product.id);

  return (
    '<div class="product-card' +
    (isViewed ? " viewed" : "") +
    '" data-product-id="' +
    product.id +
    '">' +
    '<div class="product-header">' +
    '<div class="category-badge" style="background: ' +
    categoryInfo.color +
    ';">' +
    categoryInfo.name +
    "</div>" +
    '<button class="favorite-btn' +
    (isFavorite ? " active" : "") +
    '" data-product-id="' +
    product.id +
    '">' +
    (isFavorite ? "⭐" : "☆") +
    "</button>" +
    "</div>" +
    '<h3 class="product-title">' +
    highlightedTitle +
    "</h3>" +
    '<div class="product-title-en">' +
    highlightedOtherTitle +
    "</div>" +
    '<div class="product-features">' +
    '<div class="features-title">' +
    featuresLabel +
    "</div>" +
    '<div class="features-text">' +
    highlightedFeatures +
    "</div>" +
    "</div>" +
    (details
      ? '<div class="product-details">' +
        '<div class="details-title">' +
        detailsLabel +
        "</div>" +
        '<div class="details-text">' +
        highlightedDetails +
        "</div>" +
        "</div>"
      : "") +
    (isViewed ? '<div class="viewed-badge">✓ Görüldü</div>' : "") +
    "</div>"
  );
}

function renderQuizMode() {
  if (filteredItems.length === 0) {
    showNoResults();
    return;
  }

  var randomIndex = Math.floor(Math.random() * filteredItems.length);
  var randomProduct = filteredItems[randomIndex];
  var isShowingTurkish = Math.random() > 0.5;
  var questionTitle = isShowingTurkish
    ? randomProduct.titleTR
    : randomProduct.titleEN;
  var answerTitle = isShowingTurkish
    ? randomProduct.titleEN
    : randomProduct.titleTR;

  var wrongOptions = [];
  var attempts = 0;
  while (wrongOptions.length < 3 && attempts < 20) {
    var randomProductIndex = Math.floor(Math.random() * products.length);
    var randomWrongProduct = products[randomProductIndex];
    if (randomWrongProduct.id !== randomProduct.id) {
      var wrongOption = isShowingTurkish
        ? randomWrongProduct.titleEN
        : randomWrongProduct.titleTR;
      if (wrongOptions.indexOf(wrongOption) === -1) {
        wrongOptions.push(wrongOption);
      }
    }
    attempts++;
  }

  var allOptions = [answerTitle].concat(wrongOptions);

  // Shuffle options
  for (var i = allOptions.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = allOptions[i];
    allOptions[i] = allOptions[j];
    allOptions[j] = temp;
  }

  var optionsHTML = "";
  for (var k = 0; k < allOptions.length; k++) {
    optionsHTML +=
      '<button class="quiz-option" data-answer="' +
      (allOptions[k] === answerTitle) +
      '">' +
      allOptions[k] +
      "</button>";
  }

  productGrid.innerHTML =
    '<div class="quiz-container-large">' +
    '<div class="quiz-header-large">' +
    "<h1>" +
    (language === "tr" ? "🧠 ÜRÜN QUİZ MODU" : "🧠 PRODUCT QUIZ MODE") +
    "</h1>" +
    '<p class="quiz-subtitle">' +
    (language === "tr"
      ? "Bu ürünün diğer dildeki karşılığı hangisidir?"
      : "What is the equivalent of this product in the other language?") +
    "</p>" +
    "</div>" +
    '<div class="quiz-question-large">' +
    '<div class="question-card">' +
    "<h2>" +
    questionTitle +
    "</h2>" +
    (randomProduct.featuresTR
      ? '<p class="question-features">' +
        (isShowingTurkish
          ? randomProduct.featuresTR
          : randomProduct.featuresEN) +
        "</p>"
      : "") +
    "</div>" +
    '<div class="quiz-options-large">' +
    optionsHTML +
    "</div>" +
    "</div>" +
    '<div class="quiz-controls-large">' +
    '<button id="skipQuiz" class="quiz-control-btn">' +
    (language === "tr" ? "⏭ Atla" : "⏭ Skip") +
    "</button>" +
    '<button id="newQuiz" class="quiz-control-btn primary">' +
    (language === "tr" ? "🔄 Yeni Quiz" : "🔄 New Quiz") +
    "</button>" +
    "</div>" +
    "</div>";

  addQuizEvents();
}

function renderQuestionMode() {
  if (studyQuestions.length === 0) {
    productGrid.innerHTML =
      '<div class="question-container-large">' +
      '<div class="no-results" style="display: block;">' +
      "<h3>" +
      (language === "tr" ? "❓ Henüz soru yok" : "❓ No questions yet") +
      "</h3>" +
      "<p>" +
      (language === "tr"
        ? "JSON dosyasına sorular eklendiğinde burada görünecek"
        : "Questions will appear here when added to JSON file") +
      "</p>" +
      "</div>" +
      "</div>";
    return;
  }

  // currentQuestionIndex'i sınırlar içinde tut
  if (currentQuestionIndex >= studyQuestions.length) {
    currentQuestionIndex = 0;
  }
  if (currentQuestionIndex < 0) {
    currentQuestionIndex = studyQuestions.length - 1;
  }

  var question = studyQuestions[currentQuestionIndex];
  var questionText =
    language === "tr" ? question.questionTR : question.questionEN;
  var answerText = language === "tr" ? question.answerTR : question.answerEN;

  productGrid.innerHTML =
    '<div class="question-container-large">' +
    '<div class="question-header-large">' +
    "<h1>" +
    (language === "tr" ? "❓ MÜLAKAT SORULARI" : "❓ INTERVIEW QUESTIONS") +
    "</h1>" +
    '<div class="question-category">' +
    question.category +
    "</div>" +
    "</div>" +
    '<div class="question-content-large">' +
    '<div class="question-card-large">' +
    '<h2 class="question-text">' +
    questionText +
    "</h2>" +
    '<div class="answer-section">' +
    '<button id="showAnswer" class="show-answer-btn">' +
    (language === "tr" ? "💡 Cevabı Göster" : "💡 Show Answer") +
    "</button>" +
    '<div id="answerContent" class="answer-content hidden">' +
    "<h3>" +
    (language === "tr" ? "Örnek Cevap:" : "Sample Answer:") +
    "</h3>" +
    "<p>" +
    answerText +
    "</p>" +
    "</div>" +
    "</div>" +
    "</div>" +
    "</div>" +
    '<div class="question-controls-large">' +
    '<button id="prevQuestion" class="question-control-btn">' +
    (language === "tr" ? "⬅ Önceki Soru" : "⬅ Previous Question") +
    "</button>" +
    '<span class="question-counter">' +
    (currentQuestionIndex + 1) +
    " / " +
    studyQuestions.length +
    "</span>" +
    '<button id="nextQuestion" class="question-control-btn primary">' +
    (language === "tr" ? "Sonraki Soru ➡" : "Next Question ➡") +
    "</button>" +
    "</div>" +
    "</div>";

  addQuestionEvents();
}

function renderFlashcardMode() {
  if (filteredItems.length === 0) {
    showNoResults();
    return;
  }

  // currentFlashcardIndex'i sınırlar içinde tut
  if (currentFlashcardIndex >= filteredItems.length) {
    currentFlashcardIndex = 0;
  }
  if (currentFlashcardIndex < 0) {
    currentFlashcardIndex = filteredItems.length - 1;
  }

  var currentProduct = filteredItems[currentFlashcardIndex];

  productGrid.innerHTML =
    '<div class="flashcard-container-large">' +
    '<div class="flashcard-header-large">' +
    "<h1>" +
    (language === "tr" ? "🎴 FLASHCARD MODU" : "🎴 FLASHCARD MODE") +
    "</h1>" +
    '<p class="flashcard-subtitle">' +
    (language === "tr"
      ? "Kartı çevirmek için tıklayın"
      : "Click the card to flip") +
    "</p>" +
    "</div>" +
    '<div class="flashcard-large" id="flashcard">' +
    '<div class="flashcard-front-large">' +
    "<h2>" +
    currentProduct.titleTR +
    "</h2>" +
    '<p class="flashcard-features-large">' +
    currentProduct.featuresTR +
    "</p>" +
    (currentProduct.detailsTR
      ? '<div class="flashcard-details-large">' +
        currentProduct.detailsTR +
        "</div>"
      : "") +
    "</div>" +
    '<div class="flashcard-back-large">' +
    "<h2>" +
    currentProduct.titleEN +
    "</h2>" +
    '<p class="flashcard-features-large">' +
    currentProduct.featuresEN +
    "</p>" +
    (currentProduct.detailsEN
      ? '<div class="flashcard-details-large">' +
        currentProduct.detailsEN +
        "</div>"
      : "") +
    "</div>" +
    "</div>" +
    '<div class="flashcard-controls-large">' +
    '<button id="prevCard" class="flashcard-control-btn">⬅ ' +
    (language === "tr" ? "Önceki" : "Previous") +
    "</button>" +
    '<span class="card-counter-large">' +
    (currentFlashcardIndex + 1) +
    " / " +
    filteredItems.length +
    "</span>" +
    '<button id="nextCard" class="flashcard-control-btn">' +
    (language === "tr" ? "Sonraki" : "Next") +
    " ➡</button>" +
    "</div>" +
    "</div>";

  addFlashcardEvents();
}

function addProductCardEvents() {
  var cards = document.querySelectorAll(".product-card");
  for (var i = 0; i < cards.length; i++) {
    cards[i].addEventListener("click", function (e) {
      if (e.target.classList.contains("favorite-btn")) return;

      var productId = this.dataset.productId;
      studyStats.viewedProducts.add(productId);
      this.classList.add("viewed");

      if (!this.querySelector(".viewed-badge")) {
        var badge = document.createElement("div");
        badge.className = "viewed-badge";
        badge.textContent = "✓ Görüldü";
        this.appendChild(badge);
      }

      updateProgressDisplay();
    });
  }

  var favoriteButtons = document.querySelectorAll(".favorite-btn");
  for (var j = 0; j < favoriteButtons.length; j++) {
    favoriteButtons[j].addEventListener("click", function (e) {
      e.stopPropagation();
      var productId = this.dataset.productId;

      if (studyStats.favorites.has(productId)) {
        studyStats.favorites.delete(productId);
        this.textContent = "☆";
        this.classList.remove("active");
      } else {
        studyStats.favorites.add(productId);
        this.textContent = "⭐";
        this.classList.add("active");
      }

      if (studyMode === "favorites") {
        searchProducts(searchBox ? searchBox.value : "");
        displayProducts();
      }
    });
  }
}

function addQuizEvents() {
  var quizOptions = document.querySelectorAll(".quiz-option");
  for (var i = 0; i < quizOptions.length; i++) {
    quizOptions[i].addEventListener("click", function () {
      var isCorrect = this.dataset.answer === "true";

      var allOptions = document.querySelectorAll(".quiz-option");
      for (var j = 0; j < allOptions.length; j++) {
        allOptions[j].disabled = true;
      }

      if (isCorrect) {
        this.classList.add("correct");
        studyStats.quizScore++;
      } else {
        this.classList.add("wrong");
        var correctBtn = document.querySelector('[data-answer="true"]');
        if (correctBtn) correctBtn.classList.add("correct");
      }

      studyStats.totalQuizzes++;
      updateProgressDisplay();

      setTimeout(function () {
        renderQuizMode();
      }, 2500);
    });
  }

  var skipBtn = document.getElementById("skipQuiz");
  var newBtn = document.getElementById("newQuiz");

  if (skipBtn) {
    skipBtn.addEventListener("click", function () {
      renderQuizMode();
    });
  }
  if (newBtn) {
    newBtn.addEventListener("click", function () {
      renderQuizMode();
    });
  }
}

function addQuestionEvents() {
  var showAnswerBtn = document.getElementById("showAnswer");
  var answerContent = document.getElementById("answerContent");
  var prevBtn = document.getElementById("prevQuestion");
  var nextBtn = document.getElementById("nextQuestion");

  if (showAnswerBtn && answerContent) {
    showAnswerBtn.addEventListener("click", function () {
      answerContent.classList.toggle("hidden");
      showAnswerBtn.textContent = answerContent.classList.contains("hidden")
        ? language === "tr"
          ? "💡 Cevabı Göster"
          : "💡 Show Answer"
        : language === "tr"
        ? "🙈 Cevabı Gizle"
        : "🙈 Hide Answer";
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener("click", function () {
      currentQuestionIndex =
        currentQuestionIndex > 0
          ? currentQuestionIndex - 1
          : studyQuestions.length - 1;
      renderQuestionMode();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", function () {
      currentQuestionIndex =
        currentQuestionIndex < studyQuestions.length - 1
          ? currentQuestionIndex + 1
          : 0;
      renderQuestionMode();
    });
  }
}

function addFlashcardEvents() {
  var flashcard = document.getElementById("flashcard");
  var prevBtn = document.getElementById("prevCard");
  var nextBtn = document.getElementById("nextCard");

  if (flashcard) {
    flashcard.addEventListener("click", function () {
      this.classList.toggle("flipped");
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener("click", function () {
      currentFlashcardIndex =
        currentFlashcardIndex > 0
          ? currentFlashcardIndex - 1
          : filteredItems.length - 1;
      renderFlashcardMode();

      // Viewed olarak işaretle
      var currentProduct = filteredItems[currentFlashcardIndex];
      studyStats.viewedProducts.add(currentProduct.id);
      updateProgressDisplay();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", function () {
      currentFlashcardIndex =
        currentFlashcardIndex < filteredItems.length - 1
          ? currentFlashcardIndex + 1
          : 0;
      renderFlashcardMode();

      // Viewed olarak işaretle
      var currentProduct = filteredItems[currentFlashcardIndex];
      studyStats.viewedProducts.add(currentProduct.id);
      updateProgressDisplay();
    });
  }
}

function addStudyEventListeners() {
  if (studyModeButtons.browse) {
    studyModeButtons.browse.addEventListener("click", function () {
      setStudyMode("browse");
    });
  }
  if (studyModeButtons.quiz) {
    studyModeButtons.quiz.addEventListener("click", function () {
      setStudyMode("quiz");
    });
  }
  if (studyModeButtons.question) {
    studyModeButtons.question.addEventListener("click", function () {
      setStudyMode("question");
    });
  }
  if (studyModeButtons.flashcard) {
    studyModeButtons.flashcard.addEventListener("click", function () {
      setStudyMode("flashcard");
    });
  }
  if (studyModeButtons.favorites) {
    studyModeButtons.favorites.addEventListener("click", function () {
      setStudyMode("favorites");
    });
  }
}

function setStudyMode(mode) {
  studyMode = mode;

  // Index'leri sıfırla
  currentQuestionIndex = 0;
  currentFlashcardIndex = 0;

  // Tüm butonlardan active class'ını kaldır
  for (var key in studyModeButtons) {
    if (studyModeButtons[key]) {
      studyModeButtons[key].classList.remove("active");
    }
  }

  // Seçili butona active class ekle
  if (studyModeButtons[mode]) {
    studyModeButtons[mode].classList.add("active");
  }

  if (mode === "question") {
    filteredItems = studyQuestions;
  } else {
    searchProducts(searchBox ? searchBox.value : "");
  }
  displayProducts();
}

function updateProgressDisplay() {
  var progressText = document.getElementById("progressText");
  var scoreText = document.getElementById("scoreText");

  if (progressText) {
    var viewed = studyStats.viewedProducts.size;
    var total = products.length;
    var progressPercent = total > 0 ? Math.round((viewed / total) * 100) : 0;

    progressText.textContent =
      language === "tr"
        ? "İlerleme: " + viewed + "/" + total + " (" + progressPercent + "%)"
        : "Progress: " + viewed + "/" + total + " (" + progressPercent + "%)";

    if (progressBar) {
      progressBar.style.width = progressPercent + "%";
    }
  }

  if (scoreText) {
    var scorePercent =
      studyStats.totalQuizzes > 0
        ? Math.round((studyStats.quizScore / studyStats.totalQuizzes) * 100)
        : 0;

    scoreText.textContent =
      language === "tr"
        ? "Quiz Skoru: " +
          scorePercent +
          "% (" +
          studyStats.quizScore +
          "/" +
          studyStats.totalQuizzes +
          ")"
        : "Quiz Score: " +
          scorePercent +
          "% (" +
          studyStats.quizScore +
          "/" +
          studyStats.totalQuizzes +
          ")";
  }
}

function getCategoryInfo(product) {
  if (product.category && categories[product.category]) {
    var cat = categories[product.category];
    return {
      name: language === "tr" ? cat.nameTR : cat.nameEN,
      color: cat.color,
    };
  }

  return {
    name: language === "tr" ? "Endüstriyel Ürün" : "Industrial Product",
    color: "#667eea",
  };
}

function switchLanguage() {
  language = language === "tr" ? "en" : "tr";
  updateLanguageElements();
  displayProducts();
  updateProgressDisplay();
}

function updateLanguageElements() {
  if (langButton) {
    langButton.textContent = language === "tr" ? "English" : "Türkçe";
  }

  if (searchBox) {
    searchBox.placeholder =
      language === "tr"
        ? "Ürün ara... (örn: torkmetre, bataryalı, hava)"
        : "Search products... (e.g: torque, battery, pneumatic)";
  }

  updateStudyModeButtons();
}

function updateStudyModeButtons() {
  if (studyModeButtons.browse) {
    studyModeButtons.browse.innerHTML =
      language === "tr" ? "📚 Gözden Geçir" : "📚 Browse";
  }
  if (studyModeButtons.quiz) {
    studyModeButtons.quiz.innerHTML = language === "tr" ? "🧠 Quiz" : "🧠 Quiz";
  }
  if (studyModeButtons.question) {
    studyModeButtons.question.innerHTML =
      language === "tr" ? "❓ Sorular" : "❓ Questions";
  }
  if (studyModeButtons.flashcard) {
    studyModeButtons.flashcard.innerHTML =
      language === "tr" ? "🎴 Flashcard" : "🎴 Flashcard";
  }
  if (studyModeButtons.favorites) {
    studyModeButtons.favorites.innerHTML =
      language === "tr" ? "⭐ Favoriler" : "⭐ Favorites";
  }
}

function addEventListeners() {
  if (searchBox) {
    searchBox.addEventListener("input", function (e) {
      searchProducts(e.target.value);
      displayProducts();
    });

    searchBox.addEventListener("focus", function () {
      searchBox.style.transform = "scale(1.02)";
    });

    searchBox.addEventListener("blur", function () {
      searchBox.style.transform = "scale(1)";
    });
  }

  if (langButton) {
    langButton.addEventListener("click", switchLanguage);
  }

  document.addEventListener("keydown", function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === "k") {
      e.preventDefault();
      if (searchBox) {
        searchBox.focus();
        searchBox.select();
      }
    }

    if (e.key === "Escape" && document.activeElement === searchBox) {
      if (searchBox) {
        searchBox.value = "";
        searchProducts("");
        displayProducts();
      }
    }

    if (e.key >= "1" && e.key <= "5") {
      var modes = ["browse", "quiz", "question", "flashcard", "favorites"];
      var modeIndex = parseInt(e.key) - 1;
      if (modes[modeIndex]) {
        setStudyMode(modes[modeIndex]);
      }
    }

    // Keyboard navigation for questions and flashcards
    if (
      studyMode === "question" &&
      (e.key === "ArrowLeft" || e.key === "ArrowRight")
    ) {
      e.preventDefault();
      if (e.key === "ArrowLeft") {
        currentQuestionIndex =
          currentQuestionIndex > 0
            ? currentQuestionIndex - 1
            : studyQuestions.length - 1;
      } else {
        currentQuestionIndex =
          currentQuestionIndex < studyQuestions.length - 1
            ? currentQuestionIndex + 1
            : 0;
      }
      renderQuestionMode();
    }

    if (
      studyMode === "flashcard" &&
      (e.key === "ArrowLeft" || e.key === "ArrowRight")
    ) {
      e.preventDefault();
      if (e.key === "ArrowLeft") {
        currentFlashcardIndex =
          currentFlashcardIndex > 0
            ? currentFlashcardIndex - 1
            : filteredItems.length - 1;
      } else {
        currentFlashcardIndex =
          currentFlashcardIndex < filteredItems.length - 1
            ? currentFlashcardIndex + 1
            : 0;
      }
      renderFlashcardMode();

      // Viewed olarak işaretle
      var currentProduct = filteredItems[currentFlashcardIndex];
      studyStats.viewedProducts.add(currentProduct.id);
      updateProgressDisplay();
    }

    // Spacebar to flip flashcard
    if (studyMode === "flashcard" && e.key === " ") {
      e.preventDefault();
      var flashcard = document.getElementById("flashcard");
      if (flashcard) {
        flashcard.classList.toggle("flipped");
      }
    }
  });
}

// Çalışma yardımcı fonksiyonlar
window.studyHelper = {
  getAllProducts: function () {
    return products;
  },
  getFilteredProducts: function () {
    return filteredItems;
  },
  getCurrentLanguage: function () {
    return language;
  },
  searchByKeyword: function (keyword) {
    if (searchBox) searchBox.value = keyword;
    searchProducts(keyword);
    displayProducts();
  },
  resetSearch: function () {
    if (searchBox) searchBox.value = "";
    searchProducts("");
    displayProducts();
  },
  switchToLanguage: function (lang) {
    if (lang === "tr" || lang === "en") {
      language = lang;
      updateLanguageElements();
      displayProducts();
      updateProgressDisplay();
    }
  },
  setMode: function (mode) {
    if (
      ["browse", "quiz", "question", "flashcard", "favorites"].indexOf(mode) !==
      -1
    ) {
      setStudyMode(mode);
    }
  },
  getStudyStats: function () {
    return {
      viewedCount: studyStats.viewedProducts.size,
      totalProducts: products.length,
      viewedPercentage: Math.round(
        (studyStats.viewedProducts.size / products.length) * 100
      ),
      favoritesCount: studyStats.favorites.size,
      quizScore: studyStats.quizScore,
      totalQuizzes: studyStats.totalQuizzes,
      quizPercentage:
        studyStats.totalQuizzes > 0
          ? Math.round((studyStats.quizScore / studyStats.totalQuizzes) * 100)
          : 0,
    };
  },
  resetProgress: function () {
    studyStats.viewedProducts.clear();
    studyStats.favorites.clear();
    studyStats.quizScore = 0;
    studyStats.totalQuizzes = 0;
    currentQuestionIndex = 0;
    currentFlashcardIndex = 0;
    updateProgressDisplay();
    displayProducts();
  },
  goToQuestion: function (index) {
    if (index >= 0 && index < studyQuestions.length) {
      currentQuestionIndex = index;
      setStudyMode("question");
    }
  },
  goToFlashcard: function (index) {
    if (index >= 0 && index < filteredItems.length) {
      currentFlashcardIndex = index;
      setStudyMode("flashcard");
    }
  },
};
