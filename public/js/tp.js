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

// Add this to your existing main.js file

// Gita chapter information
const gitaChapters = [
    { number: 1, name: "Arjuna Vishada Yoga", verses: 47 },
    { number: 2, name: "Sankhya Yoga", verses: 72 },
    { number: 3, name: "Karma Yoga", verses: 43 },
    { number: 4, name: "Jnana Yoga", verses: 42 },
    { number: 5, name: "Karma Sanyasa Yoga", verses: 29 },
    { number: 6, name: "Dhyana Yoga", verses: 47 },
    { number: 7, name: "Jnana Vijnana Yoga", verses: 30 },
    { number: 8, name: "Aksara Brahma Yoga", verses: 28 },
    { number: 9, name: "Raja Vidya Yoga", verses: 34 },
    { number: 10, name: "Vibhuti Yoga", verses: 42 },
    { number: 11, name: "Visvarupa Darsana Yoga", verses: 55 },
    { number: 12, name: "Bhakti Yoga", verses: 20 },
    { number: 13, name: "Ksetra Ksetrajna Vibhaga Yoga", verses: 34 },
    { number: 14, name: "Gunatraya Vibhaga Yoga", verses: 27 },
    { number: 15, name: "Purusottama Yoga", verses: 20 },
    { number: 16, name: "Daivasura Sampad Vibhaga Yoga", verses: 24 },
    { number: 17, name: "Sraddhatraya Vibhaga Yoga", verses: 28 },
    { number: 18, name: "Moksha Sanyasa Yoga", verses: 78 }
  ];
  
  // Calculate total verses
  const totalVerses = gitaChapters.reduce((sum, chapter) => sum + chapter.verses, 0);
  
  // Create timeline navigation for Bhagavad Gita
  function createTimelineNavigation() {
    const isShlokPage = document.getElementById('shlok-text');
    if (!isShlokPage) return;
  
    // Get current shlok information
    const pathSegments = window.location.pathname.split("/");
    const currentIndex = parseInt(pathSegments[pathSegments.length - 1], 10) || 1;
    
    // Create timeline container
    const timelineContainer = document.createElement('div');
    timelineContainer.className = 'timeline-container timeline-collapsed';
    
    // Create toggle button for mobile
    const timelineToggle = document.createElement('button');
    timelineToggle.className = 'timeline-toggle';
    timelineToggle.innerHTML = 'Bhagavad Gita Navigation <span class="timeline-toggle-icon">▼</span>';
    timelineToggle.addEventListener('click', () => {
      timelineContainer.classList.toggle('timeline-collapsed');
    });
    timelineContainer.appendChild(timelineToggle);
    
    // Create timeline
    const timeline = document.createElement('div');
    timeline.className = 'timeline';
    
    const timelineProgress = document.createElement('div');
    timelineProgress.className = 'timeline-progress';
    timeline.appendChild(timelineProgress);
    
    timelineContainer.appendChild(timeline);
    
    // Create chapter marks container
    const chapterMarks = document.createElement('div');
    chapterMarks.className = 'timeline-chapter-marks';
    timelineContainer.appendChild(chapterMarks);
    
    // Create timeline info
    const timelineInfo = document.createElement('div');
    timelineInfo.className = 'timeline-info';
    timelineContainer.appendChild(timelineInfo);
    
    // Insert timeline before the main container
    const mainContainer = document.querySelector('.container');
    document.body.insertBefore(timelineContainer, mainContainer);
    
    // Function to update timeline based on current index
    function updateTimeline(currentIndex) {
      // Calculate which chapter and verse this index represents
      let cumulativeVerses = 0;
      let currentChapter = 1;
      let currentVerse = currentIndex;
      
      for (const chapter of gitaChapters) {
        if (currentIndex > cumulativeVerses && currentIndex <= cumulativeVerses + chapter.verses) {
          currentChapter = chapter.number;
          currentVerse = currentIndex - cumulativeVerses;
          break;
        }
        cumulativeVerses += chapter.verses;
      }
      
      // Calculate progress percentage
      const progressPercentage = (currentIndex / totalVerses) * 100;
      timelineProgress.style.width = `${progressPercentage}%`;
      
      // Clear existing markers
      while (timeline.childNodes.length > 1) {
        timeline.removeChild(timeline.lastChild);
      }
      chapterMarks.innerHTML = '';
      
      // Add current position marker
      const currentMarker = document.createElement('div');
      currentMarker.className = 'timeline-marker current';
      currentMarker.style.left = `${progressPercentage}%`;
      
      const currentTooltip = document.createElement('div');
      currentTooltip.className = 'timeline-tooltip';
      currentTooltip.textContent = `Chapter ${currentChapter}, Verse ${currentVerse}`;
      currentMarker.appendChild(currentTooltip);
      
      timeline.appendChild(currentMarker);
      
      // Add chapter marks
      let verseCount = 0;
      gitaChapters.forEach((chapter, index) => {
        // Calculate position for chapter start
        const position = (verseCount / totalVerses) * 100;
        
        // Only show major chapters on smaller screens
        if (window.innerWidth > 768 || index % 3 === 0 || index === gitaChapters.length - 1) {
          const chapterMark = document.createElement('div');
          chapterMark.className = 'chapter-mark';
          chapterMark.style.left = `${position}%`;
          chapterMark.textContent = chapter.number;
          
          const tooltip = document.createElement('div');
          tooltip.className = 'timeline-tooltip';
          tooltip.textContent = `Chapter ${chapter.number}: ${chapter.name}`;
          chapterMark.appendChild(tooltip);
          
          chapterMark.addEventListener('click', () => {
            // Navigate to the first verse of this chapter
            window.location.href = `/shlok/${verseCount + 1}`;
          });
          
          chapterMarks.appendChild(chapterMark);
        }
        
        verseCount += chapter.verses;
      });
      
      // Update info text
      timelineInfo.innerHTML = `
        <div class="timeline-chapter-name">
          Chapter ${currentChapter}: ${gitaChapters[currentChapter-1].name}
        </div>
        <div class="timeline-progress-text">
          Verse ${currentVerse}/${gitaChapters[currentChapter-1].verses} 
          (${Math.round(progressPercentage)}% of Gita)
        </div>
      `;
    }
    
    // Initial update
    updateTimeline(currentIndex);
    
    // Update timeline when loading new shlok
    // This should be called from your loadShlok function
    window.updateGitaTimeline = updateTimeline;
    
    // Handle window resize
    window.addEventListener('resize', () => {
      updateTimeline(currentIndex);
    });
  }
  
  // Add this to your DOMContentLoaded event listener
  document.addEventListener("DOMContentLoaded", () => {
    // Your existing code...
    
    // Create timeline navigation
    createTimelineNavigation();
    
    // Modify your loadShlok function to update the timeline
    const originalLoadShlok = window.loadShlok;
    if (typeof originalLoadShlok === 'function') {
      window.loadShlok = function(index) {
        originalLoadShlok(index);
        if (window.updateGitaTimeline) {
          window.updateGitaTimeline(index);
        }
      };
    }
  });
  
  // Modify your existing loadShlok function to update the timeline
  // Add this inside your loadShlok function after updating the content
  function modifyExistingLoadShlok() {
    // This is a helper reference showing where to add the timeline update
    // Inside your loadShlok function, after updating the content, add:
    if (window.updateGitaTimeline) {
      window.updateGitaTimeline(index);
    }
  }

// Update to your existing loadShlok function in main.js
// Add this timeline update call to your existing function

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
  
    // Fetch the shlok data
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
        
        // ⬇️ ADD THIS LINE TO UPDATE THE TIMELINE ⬇️
        if (window.updateGitaTimeline) {
          window.updateGitaTimeline(index);
        }
      })
      .catch(err => {
        console.error("Error fetching shlok:", err);
        document.getElementById("shlok-text").innerText = "Shlok not found.";
        document.getElementById("transliteration-text").innerText = "";
        document.getElementById("translation-text").innerText = "";
      });
  }