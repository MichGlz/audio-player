


// document.addEventListener('scroll', function() {
//     const sections = document.querySelectorAll('.section');
//     const progress = document.querySelector('.progress');
//     const navLinks = document.querySelectorAll('.sub-navigation a');
//     let totalHeight = document.body.scrollHeight - window.innerHeight;
//     let scrollPosition = window.scrollY;

//     let activeSection = 0;

//     sections.forEach((section, index) => {
//         const rect = section.getBoundingClientRect();
//         if (rect.top <= 0) {
//             activeSection = index;
//         }
//     });

//     let sectionProgress = 0;

//     if (activeSection < sections.length - 1) {
//         const currentSection = sections[activeSection];
//         const nextSection = sections[activeSection + 1];
//         let sectionHeight = nextSection.offsetTop - currentSection.offsetTop;
//         let sectionScroll = scrollPosition - currentSection.offsetTop;

//         sectionProgress = (sectionScroll / sectionHeight) * 100;
//     } else {
//         sectionProgress = 100;
//     }

//     let totalSections = sections.length;
//     let linkWidth = 100 / totalSections;

//     let progressWidth = activeSection * linkWidth + (sectionProgress / 100) * linkWidth;

//     progress.style.width = progressWidth + '%';
// });

// document.addEventListener('DOMContentLoaded', function () {
//     const links = document.querySelectorAll('.link_wrapper a');
//     const sections = document.querySelectorAll('.section');
//     const progressBar = document.querySelector('.progress');
//     const progressBarContainer = document.querySelector('.progress-bar');

//     function updateProgressBar() {
//         const scrollTop = window.scrollY + progressBarContainer.getBoundingClientRect().bottom;
//         let progressPercentage = 0;
//         let targetX = 0;

//         sections.forEach((section, index) => {
//             const sectionTop = section.offsetTop;
//             const sectionHeight = section.offsetHeight;

//             if (scrollTop >= sectionTop && scrollTop <= sectionTop + sectionHeight) {
//                 const relativeScroll = scrollTop - sectionTop;
//                 progressPercentage = relativeScroll / sectionHeight;

//                 const linkRect = links[index].getBoundingClientRect();
//                 const containerRect = progressBarContainer.getBoundingClientRect();
//                 targetX = linkRect.x - containerRect.x;

//                 progressBar.style.width = `${progressPercentage * targetX}px`;
//             }
//         });
//     }

//     window.addEventListener('scroll', updateProgressBar);
//     window.addEventListener('resize', updateProgressBar);

//     updateProgressBar();
// });

// document.addEventListener("DOMContentLoaded", () => {
//     const sections = document.querySelectorAll(".section");
//     const progressBars = document.querySelectorAll(".progress-bar");
//     const links = document.querySelectorAll(".link_wrapper");
//    console.log(links);
//    links.forEach((link, index) => {
//         const rect = link.getBoundingClientRect();
//         const container = document.createElement("div");  
//         container.textContent = "";
//         for (const key in rect) {
//         if (typeof rect[key] !== "function") {
//             let para = document.createElement("p");
//             para.textContent = `${key} : ${Math.round(rect[key])}`;
//             container.appendChild(para);
//         }
//         }
//         sections[index].appendChild(container);
//     });
//     // Update progress bars based on scroll
//     const updateProgressBars = () => {
//       const windowHeight = window.innerHeight;
//       const scrollTop = window.pageYOffset;
  
//       sections.forEach((section, index) => {
//         const sectionTop = section.offsetTop;
//         const sectionHeight = section.offsetHeight;
//         const sectionBottom = sectionTop + sectionHeight;
        
//         let linkRect1;
//         let linkLeft;
//         if(index === 0) {
//             linkLeft = 0;
//         }else{
//             linkRect1 = links[index - 1].getBoundingClientRect();
//             linkLeft = linkRect1.x;
//         }

//         const linkRect2 = links[index].getBoundingClientRect();        
//         const linkLeft2 = linkRect2.x;
  
//         const start = sectionTop - windowHeight;
//         const end = sectionBottom;
  
//         const progress = Math.min(1, Math.max(0, (scrollTop - start) / (end - start)));
  
//         // Update the width of the corresponding progress bar
//         progressBars[index].style.left = `${linkLeft}px`;
//         progressBars[index].style.width = `${progress * (linkLeft2 - linkLeft)}px`;
//       });
//     };
  
//     // Handle scrolling
//     window.addEventListener("scroll", updateProgressBars);
  
//     // Initial load
//     updateProgressBars();
//   });
  

//   function update() {
//     const container = document.getElementById("controls");
//     const elem = document.querySelectorAll(".section")[1];
//     const rect = elem.getBoundingClientRect();
  
//     container.textContent = "";
//     for (const key in rect) {
//       if (typeof rect[key] !== "function") {
//         let para = document.createElement("p");
//         para.textContent = `${key} : ${Math.round(rect[key])}`;
//         container.appendChild(para);
//       }
//     }
//   }
  
//   document.addEventListener("scroll", update);
//   update();
document.addEventListener("DOMContentLoaded", () => {
    console.log("Hello");
    const sections = document.querySelectorAll(".section");
    const progressBars = document.querySelectorAll(".progress-bar");
    const links = document.querySelectorAll(".link_wrapper");
  
    // Update progress bars based on scroll
    const updateProgressBars = () => {
      const windowHeight = window.innerHeight;
      const scrollTop = window.pageYOffset;
  
      sections.forEach((section, index) => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const sectionBottom = sectionTop + sectionHeight;
  
        let start;
        let end;
        let linkLeft1, linkLeft2;
  
        if (index === 0) {
          // For the first progress bar
          linkLeft1 = 0; // Start from the left edge of the screen
          const linkRect2 = links[index].getBoundingClientRect();
          linkLeft2 = linkRect2.left;
          start = 0;
          end = sectionTop - 40; // Trigger the growth as soon as section hits the top
        } else if (index < sections.length - 1) {
          // For middle progress bars
          const linkRect1 = links[index - 1].getBoundingClientRect();
          const linkRect2 = links[index].getBoundingClientRect();
          linkLeft1 = linkRect1.left - 5; // Start slightly before the previous link
          linkLeft2 = linkRect2.left;
          start = sectionTop - 40;
          end = sectionBottom + 40;
        } else {
          // For the last progress bar
          const linkRect1 = links[index - 1].getBoundingClientRect();
          linkLeft1 = linkRect1.left - 5; // Start slightly before the last link
          linkLeft2 = window.innerWidth; // End at the right edge of the screen
          start = sectionTop -40;
          end = sectionBottom + 40;
        }
  
        const progress = Math.min(1, Math.max(0, (scrollTop - start) / (end - start)));
  
        // Update the progress bar position and width
        progressBars[index].style.left = `${linkLeft1}px`;
        progressBars[index].style.width = `${progress * (linkLeft2 - linkLeft1)}px`;
      });
    };
  
    // Handle scrolling
    window.addEventListener("scroll", updateProgressBars);
  
    // Initial load
    updateProgressBars();
  });
  
//   document.addEventListener("DOMContentLoaded", () => {
//     const sections = document.querySelectorAll(".section");
//     const progressBars = document.querySelectorAll(".progress-bar");
//     const links = document.querySelectorAll(".link_wrapper");

//     // Update progress bars based on scroll position
//     const updateProgressBars = () => {
//         const scrollTop = window.pageYOffset;
//         const windowHeight = window.innerHeight;

//         progressBars.forEach((progressBar, index) => {
//             const section = sections[index];
//             const sectionTop = section.offsetTop;
//             const sectionHeight = section.offsetHeight;
//             const sectionBottom = sectionTop + sectionHeight;

//             // Get the current link's x position
//             const currentLinkRect = links[index].getBoundingClientRect();
//             const currentLinkX = currentLinkRect.x;

//             // Get the previous link's x position (or start at 0 for the first progress bar)
//             let previousLinkX = 0;
//             if (index > 0) {
//                 const previousLinkRect = links[index - 1].getBoundingClientRect();
//                 previousLinkX = previousLinkRect.x - 5; // 5px offset
//             }

//             // Calculate the progress of the current section
//             const progress = Math.min(1, Math.max(0, (scrollTop - sectionTop + windowHeight) / sectionHeight));

//             // Set the left position and width of the progress bar
//             progressBar.style.left = `${previousLinkX}px`;
//             progressBar.style.width = `${previousLinkX + progress * (currentLinkX - previousLinkX)}px`;
//         });

//         // Handle the last progress bar reaching the end of the screen
//         const lastProgressBar = progressBars[progressBars.length - 1];
//         const lastLinkRect = links[links.length - 1].getBoundingClientRect();
//         const lastLinkX = lastLinkRect.x - 5;
//         lastProgressBar.style.width = `${lastLinkX + (window.innerWidth - lastLinkX)}px`;
//     };

//     // Attach scroll event
//     window.addEventListener("scroll", updateProgressBars);

//     // Initial load
//     updateProgressBars();
// });
