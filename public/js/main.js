// public/js/main.js - Improved with swipe functionality and API integration

// Theme toggle functionality
function toggleTheme() {
  document.body.classList.toggle("dark-mode");
  // Save preference to localStorage
  const isDarkMode = document.body.classList.contains('dark-mode');
  localStorage.setItem('darkMode', isDarkMode);
}

document.addEventListener("DOMContentLoaded", () => {
  // Initialize theme from localStorage
  if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
  }

  // Check if we're on the shlok page
  const isShlokPage = document.getElementById('shlok-text');
  if (!isShlokPage) return;

  // 1. Extract index from the URL path: /shlok/6 -> last part is "6"
  const pathSegments = window.location.pathname.split("/");
  let currentIndex = parseInt(pathSegments[pathSegments.length - 1], 10);

  if (isNaN(currentIndex)) {
    console.error("No valid index found in URL path.");
    currentIndex = 1; // Default to 1 if invalid
  }

  // Function to load shlok data
  function loadShlok(index) {
    // Show loading state
    document.getElementById("shlok-text").innerHTML = `
      <div class="loading">
        <div></div>
        <div></div>
      </div>
    `;
    document.getElementById("transliteration-text").innerText = "Loading...";
    document.getElementById("translation-text").innerText = "Loading...";

    // 2. Fetch the shlok data
    fetch(`/api/shlok?index=${index}`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`Server error: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        if (!data || !data.shlok) {
          throw new Error("Shlok not found or missing fields.");
        }

        // Populate the page
        document.getElementById("chapter-title").innerText = `${data.chapter} - ${data.verse}`;
        document.getElementById("shlok-text").innerHTML = data.shlok.replace(/\n/g, '<br>');
        document.getElementById("transliteration-text").innerHTML = data.transliteration.replace(/\n/g, '<br>');
        document.getElementById("translation-text").innerText = data.translation;

        // Update URL without reloading
        updateURL(index);

        // Update swipe indicator if it exists
        updateSwipeIndicator(index);
      })
      .catch(err => {
        console.error("Error fetching shlok:", err);
        document.getElementById("shlok-text").innerText = "Shlok not found.";
        document.getElementById("transliteration-text").innerText = "";
        document.getElementById("translation-text").innerText = "";
      });
  }

  // Navigation functions
  function goToNext() {
    window.location.href = `/shlok/${currentIndex + 1}`;
  }

  function goToPrevious() {
    if (currentIndex > 1) {
      window.location.href = `/shlok/${currentIndex - 1}`;
    } else {
      // Optional: Show a subtle notification instead of an alert
      const container = document.querySelector('.container');
      const notification = document.createElement('div');
      notification.className = 'notification';
      notification.textContent = 'You are at the first verse';
      notification.style.position = 'fixed';
      notification.style.bottom = '20px';
      notification.style.left = '50%';
      notification.style.transform = 'translateX(-50%)';
      notification.style.padding = '10px 20px';
      notification.style.backgroundColor = 'var(--accent-color)';
      notification.style.color = 'white';
      notification.style.borderRadius = '4px';
      notification.style.opacity = '0';
      notification.style.transition = 'opacity 0.3s';
      
      document.body.appendChild(notification);
      setTimeout(() => { notification.style.opacity = '1'; }, 10);
      setTimeout(() => { 
        notification.style.opacity = '0'; 
        setTimeout(() => { document.body.removeChild(notification); }, 300);
      }, 2000);
    }
  }

  // Update URL without refreshing the page
  function updateURL(index) {
    if (window.history.pushState) {
      const newURL = `/shlok/${index}`;
      window.history.pushState({ path: newURL }, '', newURL);
      currentIndex = index; // Update current index
    }
  }

  // 3. Next & Previous buttons
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");

  if (prevBtn) {
    prevBtn.addEventListener("click", goToPrevious);
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", goToNext);
  }

  // Create swipe indicator for mobile
  function createSwipeIndicator() {
    const container = document.querySelector('.container');
    
    // Check if indicator already exists
    if (document.querySelector('.swipe-indicator')) return;
    
    const indicator = document.createElement('div');
    indicator.className = 'swipe-indicator';
    
    indicator.innerHTML = `
      <span>◀</span>
      <div class="dots">
        <div class="dot active"></div>
        <div class="dot"></div>
        <div class="dot"></div>
      </div>
      <span>▶</span>
    `;
    
    container.appendChild(indicator);
  }

  // Update swipe indicator dots - simplified version since we don't know total verses
  function updateSwipeIndicator(index) {
    const indicator = document.querySelector('.swipe-indicator');
    if (!indicator) return;
    
    // We're using a simplified indicator with 3 dots since we don't know total count
    const dotsContainer = indicator.querySelector('.dots');
    if (!dotsContainer) return;
    
    // Simple visual indication of movement
    const dots = dotsContainer.querySelectorAll('.dot');
    dots.forEach(dot => dot.classList.remove('active'));
    
    // Middle dot is always active, we're just animating the transition
    dots[1].classList.add('active');
    
    // Add a transition effect
    dotsContainer.style.transform = 'translateX(2px)';
    setTimeout(() => {
      dotsContainer.style.transition = 'transform 0.5s';
      dotsContainer.style.transform = 'translateX(0)';
    }, 50);
    setTimeout(() => {
      dotsContainer.style.transition = '';
    }, 550);
  }

  // Touch swipe detection
  let touchStartX = 0;
  let touchEndX = 0;
  let isSwiping = false;
  
  function handleTouchStart(e) {
    touchStartX = e.touches[0].clientX;
    isSwiping = true;
  }
  
  function handleTouchMove(e) {
    if (!isSwiping) return;
    touchEndX = e.touches[0].clientX;
    
    // Optional: add visual feedback during swipe
    const delta = touchEndX - touchStartX;
    if (Math.abs(delta) > 20) {
      const container = document.querySelector('.container');
      container.style.transform = `translateX(${delta * 0.1}px)`;
    }
  }
  
  function handleTouchEnd() {
    if (!isSwiping) return;
    
    // Reset any visual transformations
    const container = document.querySelector('.container');
    container.style.transition = 'transform 0.3s';
    container.style.transform = 'translateX(0)';
    setTimeout(() => { container.style.transition = ''; }, 300);
    
    if (touchStartX - touchEndX > 50) {
      // Swipe left - go to next
      goToNext();
    } else if (touchEndX - touchStartX > 50) {
      // Swipe right - go to previous
      goToPrevious();
    }
    
    touchStartX = 0;
    touchEndX = 0;
    isSwiping = false;
  }
  
  // Add swipe functionality for mobile devices
  function setupMobileSwipe() {
    // Only setup swipe for mobile devices
    if (window.innerWidth <= 768) {
      const container = document.querySelector('.container');
      if (container) {
        container.addEventListener('touchstart', handleTouchStart, { passive: true });
        container.addEventListener('touchmove', handleTouchMove, { passive: true });
        container.addEventListener('touchend', handleTouchEnd, { passive: true });
        
        // Add visual indicator for mobile users
        createSwipeIndicator();
        
        // Hide buttons on mobile
        const navButtons = document.querySelector('.nav-buttons');
        if (navButtons) {
          navButtons.style.display = 'none';
        }
      }
    }
  }
  
  // Handle window resize
  window.addEventListener('resize', () => {
    if (window.innerWidth <= 768) {
      setupMobileSwipe();
      const navButtons = document.querySelector('.nav-buttons');
      if (navButtons) navButtons.style.display = 'none';
    } else {
      const navButtons = document.querySelector('.nav-buttons');
      if (navButtons) navButtons.style.display = 'flex';
      
      // Remove swipe indicator on larger screens
      const indicator = document.querySelector('.swipe-indicator');
      if (indicator) indicator.remove();
    }
  });
  
  // Initial setup
  setupMobileSwipe();
  loadShlok(currentIndex);
});