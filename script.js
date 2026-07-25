


window.initEngine = function() {

    // Visibility Logic
  var userCountry = sessionStorage.getItem('userCountry');
  
  function evaluateVisibility() {
    document.querySelectorAll("[data-visibility]").forEach(function(el) {
      try {
        var visibility = JSON.parse(el.getAttribute("data-visibility"));
        if (!visibility) return;
        
        var isVisible = true;
        var w = window.innerWidth;
        var deviceView = w < 768 ? "mobile" : w < 1024 ? "tablet" : "desktop";
        if (deviceView === "desktop" && visibility.desktop === false) isVisible = false;
        if (deviceView === "tablet" && visibility.tablet === false) isVisible = false;
        if (deviceView === "mobile" && visibility.mobile === false) isVisible = false;

        if (visibility.os && visibility.os.length > 0) {
          var ua = navigator.userAgent.toLowerCase();
          var currentOs = "other";
          if (ua.indexOf("win") > -1) currentOs = "windows";
          else if (ua.indexOf("mac") > -1) currentOs = "mac";
          else if (ua.indexOf("linux") > -1 && ua.indexOf("android") === -1) currentOs = "linux";
          else if (ua.indexOf("iphone") > -1 || ua.indexOf("ipad") > -1 || ua.indexOf("ipod") > -1) currentOs = "ios";
          else if (ua.indexOf("android") > -1) currentOs = "android";
          if (visibility.os.indexOf(currentOs) === -1) isVisible = false;
        }

        if (visibility.allowedCountries && visibility.allowedCountries.length > 0) {
          if (userCountry) {
            var isAllowed = false;
            for(var i=0; i<visibility.allowedCountries.length; i++) {
              if(visibility.allowedCountries[i].toLowerCase() === userCountry.toLowerCase()) isAllowed = true;
            }
            if(!isAllowed) isVisible = false;
          } else {
            // Country not yet loaded, wait
            return;
          }
        }

        if (visibility.restrictedCountries && visibility.restrictedCountries.length > 0) {
          if (userCountry) {
            for(var i=0; i<visibility.restrictedCountries.length; i++) {
              if(visibility.restrictedCountries[i].toLowerCase() === userCountry.toLowerCase()) isVisible = false;
            }
          } else {
            // Country not yet loaded, wait
            return;
          }
        }

        if (!isVisible) {
          el.style.display = "none";
        } else {
          el.style.display = "";
        }
      } catch (e) {}
    });
  }

  if (!userCountry) {
    // Check if we need to fetch country (i.e., any element has country restrictions)
    var needsCountry = false;
    document.querySelectorAll("[data-visibility]").forEach(function(el) {
      try {
        var visibility = JSON.parse(el.getAttribute("data-visibility"));
        if ((visibility.allowedCountries && visibility.allowedCountries.length > 0) || (visibility.restrictedCountries && visibility.restrictedCountries.length > 0)) {
          needsCountry = true;
        }
      } catch (e) {}
    });

    if (needsCountry) {
      fetch('https://get.geojs.io/v1/ip/geo.json')
        .then(function(res) { return res.json(); })
        .then(function(data) {
          if (data.country) {
            userCountry = data.country;
            sessionStorage.setItem('userCountry', userCountry);
            evaluateVisibility();
          }
        }).catch(function() {
          userCountry = "Unknown";
          evaluateVisibility();
        });
    }
  }

  evaluateVisibility();
  window.addEventListener("resize", evaluateVisibility);


  document.querySelectorAll("[data-animation]").forEach(function(el) {
    try {
      var config = JSON.parse(el.getAttribute("data-animation"));
      var type = config.type;
      if (!type || type === "hero") return;
      
      var duration = config.duration !== undefined ? config.duration : 1;
      var delay = config.delay !== undefined ? config.delay : 0;
      var ease = config.ease || "easeOut";
      var trigger = config.trigger || "load";
      var scrub = config.scrub || false;
      var x = config.x || 0;
      var y = config.y || 0;
      var scale = config.scale !== undefined ? config.scale : 1;
      var rotation = config.rotation || 0;
      var opacity = config.opacity !== undefined ? config.opacity : 1;
      var direction = config.direction || "up";
      var fadeType = config.fadeType || "in";
      var zoomType = config.zoomType || "in";

      var animKeyframes = [];
      switch (type) {
        case "fade":
          animKeyframes = fadeType === "in" ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 1 }, { opacity: 0 }];
          break;
        case "slide":
          var transX = direction === "left" ? -50 : direction === "right" ? 50 : 0;
          var transY = direction === "up" ? 50 : direction === "down" ? -50 : 0;
          animKeyframes = [{ opacity: 0, transform: "translate(" + transX + "px, " + transY + "px)" }, { opacity: 1, transform: "translate(0px, 0px)" }];
          break;
        case "zoom":
          if (trigger === "hover") {
            var targetScale = zoomType === "in" ? (scale && scale !== 1 ? scale : 1.2) : 0.8;
            animKeyframes = [
              { opacity: 1, transform: "scale(1)" },
              { opacity: 1, transform: "scale(" + targetScale + ")" }
            ];
          } else {
            var s = zoomType === "in" ? 0.5 : 1.5;
            animKeyframes = [{ opacity: 0, transform: "scale(" + s + ")" }, { opacity: 1, transform: "scale(1)" }];
          }
          break;
        case "custom":
          animKeyframes = [
            { opacity: opacity, transform: "translate(" + x + "px, " + y + "px) scale(" + scale + ") rotate(" + rotation + "deg)" },
            { opacity: 1, transform: "translate(0px, 0px) scale(1) rotate(0deg)" }
          ];
          break;
      }

      if (animKeyframes.length === 0) return;

      function applyAnimation() {
         try {
           return el.animate(animKeyframes, {
             duration: duration * 1000,
             delay: delay * 1000,
             easing: ease === 'linear' ? 'linear' : ease.indexOf('In') > -1 ? 'ease-in' : 'ease-out',
             fill: 'both'
           });
         } catch(e) { return null; }
      }

      if (trigger === "scroll") {
        if (scrub) {
           var handleScroll = function() {
             var rect = el.getBoundingClientRect();
             var winHeight = window.innerHeight;
             if (rect.top <= winHeight && rect.bottom >= 0) {
                var progress = 1 - (rect.top / winHeight);
                var p = Math.max(0, Math.min(1, progress));
                if (type === "fade") {
                   el.style.opacity = fadeType === "in" ? p.toString() : (1-p).toString();
                } else if (type === "slide") {
                   var currentX = direction === "left" ? -50 * (1-p) : direction === "right" ? 50 * (1-p) : 0;
                   var currentY = direction === "up" ? 50 * (1-p) : direction === "down" ? -50 * (1-p) : 0;
                   el.style.transform = "translate(" + currentX + "px, " + currentY + "px)";
                   el.style.opacity = p.toString();
                }
             }
           };
           window.addEventListener('scroll', handleScroll, { passive: true });
           handleScroll();
        } else {
           var observer = new IntersectionObserver(function(entries) {
             if (entries[0].isIntersecting) {
               applyAnimation();
               observer.disconnect();
             }
           }, { threshold: 0.1 });
           observer.observe(el);
        }
      } else if (trigger === "hover") {
         var hoverAnim = null;
         el.addEventListener("mouseenter", function() {
            if (hoverAnim) hoverAnim.cancel();
            hoverAnim = applyAnimation();
         });
         el.addEventListener("mouseleave", function() {
            if (hoverAnim) hoverAnim.reverse();
         });
      } else if (trigger === "click") {
         el.addEventListener("click", function() { applyAnimation(); });
      } else {
         applyAnimation();
      }
    } catch (e) { console.error("Animation parse error", e); }
  });

  document.querySelectorAll("[data-image-seq]").forEach(function(el) {
    try {
      var config = JSON.parse(el.getAttribute("data-image-seq"));
      var trigger = config.trigger;
      var duration = config.duration;
      var count = config.count;
      var imgs = el.querySelectorAll("img");
      if (imgs.length === 0) return;
      var currentIndex = 0;
      
      function setIndex(idx) {
        imgs[currentIndex].style.display = "none";
        currentIndex = idx;
        imgs[currentIndex].style.display = "block";
      }

      if (trigger === "scroll") {
         var handleScroll = function() {
           var rect = el.getBoundingClientRect();
           var winHeight = window.innerHeight;
           if (rect.top <= winHeight && rect.bottom >= 0) {
              var progress = 1 - (rect.bottom / (winHeight + rect.height));
              progress = Math.max(0, Math.min(1, progress));
              var idx = Math.floor(progress * (count - 1));
              setIndex(idx);
           }
         };
         window.addEventListener("scroll", handleScroll, { passive: true });
         handleScroll();
      } else if (trigger === "load") {
         setInterval(function() { setIndex((currentIndex + 1) % count); }, duration);
      } else if (trigger === "hover") {
         var hoverTimer;
         el.addEventListener("mouseenter", function() {
            hoverTimer = setInterval(function() { setIndex((currentIndex + 1) % count); }, duration);
         });
         el.addEventListener("mouseleave", function() {
            clearInterval(hoverTimer);
            setIndex(0);
         });
      } else if (trigger === "click") {
         var clickTimer;
         var isPlaying = false;
         el.addEventListener("click", function() {
            if (isPlaying) {
               clearInterval(clickTimer);
               isPlaying = false;
            } else {
               isPlaying = true;
               clickTimer = setInterval(function() {
                  var nextIdx = (currentIndex + 1) % count;
                  setIndex(nextIdx);
                  if (nextIdx === count - 1) {
                     clearInterval(clickTimer);
                     isPlaying = false;
                  }
               }, duration);
            }
         });
      }
    } catch (e) {
      console.error("Image sequence parse error", e);
    }
  });

  document.querySelectorAll("[data-vector-keyframes]").forEach(function(el) {
    try {
      var keyframesData = JSON.parse(el.getAttribute("data-vector-keyframes"));
      var loop = el.getAttribute("data-vector-loop") !== "false";
      var pathEls = el.querySelectorAll("path");
      
      if (keyframesData.length > 0 && pathEls.length > 0) {
        keyframesData.sort(function(a, b) { return a.time - b.time; });
        var totalDuration = keyframesData[keyframesData.length - 1].time;
        if (totalDuration > 0) {
           var animFrames = [];
           animFrames.push({ d: 'path("' + (el.getAttribute("data-vector-path") || "") + '")', offset: 0 });
           keyframesData.forEach(function(kf) {
              animFrames.push({ d: 'path("' + kf.path + '")', offset: kf.time / totalDuration });
           });
           pathEls[0].animate(animFrames, {
              duration: totalDuration,
              iterations: loop ? Infinity : 1,
              direction: loop ? 'alternate' : 'normal',
              fill: 'both',
              easing: 'ease-in-out'
           });
        }
      }
    } catch (e) {
      console.error("Vector keyframe parse error", e);
    }
  });
};

function setSlide(elementId, slideIndex) {
  var container = document.getElementById("slideshow-" + elementId);
  if (!container) return;
  var slides = container.querySelectorAll(".slideshow-slide");
  var dots = container.querySelectorAll(".slide-dot");
  if (slideIndex < 0) slideIndex = slides.length - 1;
  if (slideIndex >= slides.length) slideIndex = 0;
  
  container.setAttribute("data-current-index", slideIndex);

  for (var i = 0; i < slides.length; i++) {
    slides[i].style.opacity = (i === slideIndex) ? "1" : "0";
    slides[i].style.zIndex = (i === slideIndex) ? "2" : "1";
    slides[i].style.pointerEvents = (i === slideIndex) ? "auto" : "none";
  }
  for (var j = 0; j < dots.length; j++) {
    dots[j].style.backgroundColor = (j === slideIndex) ? "#fff" : "rgba(255,255,255,0.4)";
  }
}

function moveSlide(elementId, step) {
  var container = document.getElementById("slideshow-" + elementId);
  if (!container) return;
  var slides = container.querySelectorAll(".slideshow-slide");
  if (slides.length <= 1) return;
  
  var currentIndex = parseInt(container.getAttribute("data-current-index") || "0");
  var loop = container.getAttribute("data-loop") !== "false";
  
  var nextIndex = currentIndex + step;
  if (nextIndex < 0) {
    if (!loop) return;
    nextIndex = slides.length - 1;
  } else if (nextIndex >= slides.length) {
    if (!loop) return;
    nextIndex = 0;
  }
  setSlide(elementId, nextIndex);
}

window.initSlideshows = function() {
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
  var slideshows = document.querySelectorAll("[id^='slideshow-']");
  slideshows.forEach(function(s) {
    var elementId = s.id.replace("slideshow-", "");
    var slides = s.querySelectorAll(".slideshow-slide");
    if (slides.length <= 1) return;
    
    s.setAttribute("data-current-index", "0");
    var autoplay = s.getAttribute("data-autoplay") !== "false";
    var loop = s.getAttribute("data-loop") !== "false";
    var interval = parseInt(s.getAttribute("data-interval") || "3000");
    
    if (autoplay) {
      setInterval(function() {
        var currentIndex = parseInt(s.getAttribute("data-current-index") || "0");
        if (currentIndex === slides.length - 1 && !loop) return;
        var nextIndex = (currentIndex + 1) % slides.length;
        setSlide(elementId, nextIndex);
      }, interval);
    }
  });
};


document.addEventListener("DOMContentLoaded", function() {
  window.initEngine();
  window.initSlideshows();
});

