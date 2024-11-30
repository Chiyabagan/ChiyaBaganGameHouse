
const startButton = document.getElementById('start');
const intro = document.getElementById('intro');
const userForm = document.getElementById('user-form');
const formTitle = document.querySelector('#user-form h2'); // Title in the form
const nameField = document.getElementById('name').closest('.mb-3');
const mobileField = document.getElementById('mobile').closest('.mb-3');
const form = document.getElementById('details-form');
const nameInput = document.getElementById('name');
const mobileInput = document.getElementById('mobile');
const questionContainerParent = document.getElementById('question-container-parent');
const questionContainer = document.getElementById('questions-container');
const breakContainer = document.getElementById('break-container');

startButton.addEventListener('click', () => {
// Fade out intro and display the form
intro.classList.add('animate__fadeOut');
setTimeout(() => {
    intro.classList.add('d-none');
    userForm.classList.remove('d-none');
}, 1000); // Matches fade-out duration
});



// form submission handling 
  // Import Firebase SDKs
  import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
  import { 
    getFirestore, collection, addDoc, getDocs, query, where, updateDoc, doc 
  } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

  // Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyABz1VFPnvjKTGV9ILda8OftEZJ8OLoVfI",
    authDomain: "chiya-bagan-344e2.firebaseapp.com",
    projectId: "chiya-bagan-344e2",
    storageBucket: "chiya-bagan-344e2.firebasestorage.app",
    messagingSenderId: "716025843763",
    appId: "1:716025843763:web:50a3b34a65904007de1346"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  // Function to generate a unique ID
  function generateUniqueId() {
    return Math.random().toString(36).substr(2, 10) + Date.now().toString(36);
  }

  // Check if user exists in Firestore
  async function getUserInFirestore(id) {
    const usersCollection = collection(db, "users");
    const userQuery = query(usersCollection, where("id", "==", id));
    const querySnapshot = await getDocs(userQuery);
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0]; // Return the first matching document
    }
    return null; // User not found
  }

  // Form submission handler
  document.addEventListener('DOMContentLoaded', () => {

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
      
        // Proceed with your form submission logic
        let id = localStorage.getItem('id');
        let category = document.getElementById('category').value;
        if (!id) {
          id = generateUniqueId();
          localStorage.setItem('id', id);
        }

        try {
          // Check if fields are hidden
          if (nameField.style.display === 'none' && mobileField.style.display === 'none') {
              // Start the game by fetching the questions
              if(category!=null)
              {
                fetchQuestions(category);
              }
          } else {
            // Add new user details to Firebase and make API call
            const name = nameInput.value;
            const mobile = mobileInput.value;
            const category = document.getElementById('category').value;
      
            const userDoc = await getUserInFirestore(id);
      
            if (userDoc) {
              const docRef = doc(db, "users", userDoc.id);
              await updateDoc(docRef, { name, mobile, category });
            } else {
              await addDoc(collection(db, "users"), {
                id,
                name,
                mobile,
                category,
                correctAnswerCount: 0,
              });
            }
            if(category !=null)
            {
                fetchQuestions(category);
            }
          }
        } catch (error) {
          alert('An error occurred. Please try again later.');
        }
    
    });
      
    startButton.addEventListener('click', async () => {
        checkPlayCount();

        const existingId = localStorage.getItem('id'); // Check for existing ID in localStorage
        if (existingId) {
          try {
            const userData = await getUserInFirestore(existingId);
            if (userData) {
              // User exists
              formTitle.textContent = `Welcome ${userData.data().name}`;
              formTitle.style.display = 'block';
              nameField.style.display = 'none'; // Hide name field
              mobileField.style.display = 'none'; // Hide mobile field
            } else {
              // User ID exists locally but not in Firestore, show full form
              formTitle.textContent = '';
              formTitle.style.display = 'none';
              nameField.style.display = 'block';
              mobileField.style.display = 'block';
            }
          } catch (error) {
            console.error('Error checking user existence:', error);
          }
        } else {
          // No ID in localStorage, show full form
          formTitle.textContent = '';
          formTitle.style.display = 'none';
          nameField.style.display = 'block';
          mobileField.style.display = 'block';
        }
    
           
        // Dynamically adjust the 'required' attribute
        if (nameField.style.display === 'none' && mobileField.style.display === 'none') {
            nameInput.removeAttribute('required');
            mobileInput.removeAttribute('required');
          } else {
            nameInput.setAttribute('required', 'true');
            mobileInput.setAttribute('required', 'true');
        }
        
        // Fade out intro and display the form
        intro.classList.add('animate__fadeOut');
        setTimeout(() => {
          intro.classList.add('d-none');
          userForm.classList.remove('d-none');
        }, 1000); // Matches fade-out duration
    });

  });

 
let questions = [];
let currentQuestionIndex = 0;
let timer;

// Fetch questions from Open Trivia API
async function fetchQuestions(category) {
    try {
        const response = await fetch(`https://opentdb.com/api.php?amount=10&category=${category}&difficulty=easy`);
        
        if (!response.ok) {
            console.error(`HTTP error: ${response.status}`);
            if (response.status === 429) { // Too Many Requests
                breakGame("brk");
            }
        }

        const data = await response.json();

        if (!data || !data.results || data.results.length === 0) {
            console.warn("No questions available or invalid response.");
            breakGame("brk");
        }

        // If questions are successfully fetched
        questions = data.results;
        displayNextQuestion();
        startTimer();
    } catch (error) {
        breakGame("brk");
    }
}


let correctAnswers = 0; // To track the number of correct answers
let totalQuestions = 10; // Total number of questions
let timeRemaining = 180; // Total time for the game in seconds (3 minutes)

// Start the 3-minute timer
function startTimer() {
  const timeDisplay = document.getElementById('time-left');
  timer = setInterval(() => {
    timeRemaining--;
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    timeDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    if (timeRemaining <= 0) {
      clearInterval(timer);
      endGame(); // End the game when time is up
    }
  }, 1000);
}

// Handle "Next" button click
function nextQuestion() {
    const selectedAnswer = document.querySelector(`#question-form-${currentQuestionIndex} input[name="answer"]:checked`);
    const questionData = questions[currentQuestionIndex];
  
    if (selectedAnswer) {
      const isCorrect = selectedAnswer.value === questionData.correct_answer;
      if (isCorrect) {
        correctAnswers++;
      }
    }
  
    // Move to the next question
    currentQuestionIndex++;
    
    // If we've reached the last question or the user answered enough correct answers
    if (currentQuestionIndex < totalQuestions) {
      displayNextQuestion(); // Display the next question
    } else {
      endGame(); // End the game if all questions are answered
    }
}
  
async function updateCorrectAnswerCount() {
  try {
    const userId = localStorage.getItem('id'); // Retrieve the user ID from localStorage
    const userDocSnapshot = await getUserInFirestore(userId); // Get the user's document snapshot

    if (userDocSnapshot) {
      const userData = userDocSnapshot.data(); // Access document data
      const currentCount = userData.correctAnswerCount || 0; // Default to 0 if the field is missing

      // Update the correctAnswerCount
      await updateDoc(userDocSnapshot.ref, {
        correctAnswerCount: currentCount + 1,
      });
      console.log(`Correct answer count updated`);
    } else {
      console.error("User not found!");
    }
  } catch (error) {
    console.error("Error updating correctAnswerCount:", error);
  }
}


// End the game and show the result
function endGame() {
    clearInterval(timer); // Stop the timer when the game ends
  
    if (correctAnswers >= 1) {
      questionContainer.style.display='none';
      document.getElementById('timer').style.display = 'none';
      // Get the current date and time
      const now = new Date();
      const formattedDateTime = `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;

      // Display the card with the date and time
      document.getElementById('result').innerHTML = `
        <div class="card bg-success text-white p-5 animate__animated animate__flipInY">
          <h3 class="text-light">
            Congratulations !!! You have won a cup of tea. <br> 
            Show this to Chiya Bagan Host
          </h3>
          <p class="mt-3">Date & Time: ${formattedDateTime}</p>
          <button type="button" class="btn btn-dark" id="ok-btn">Ok</button>
        </div>
      `;

      const okBtn = document.getElementById('ok-btn');
      // Event listener for the "Next" button
      okBtn.addEventListener('click', (event) => {
      if (event.target.id === 'ok-btn') {
          window.location.reload();
      }
      }); 

      // Update correctAnswerCount in Firebase
      updateCorrectAnswerCount();
       
   
    } else {
      questionContainer.style.display='none';
      document.getElementById('timer').style.display = 'none';
      document.getElementById('result').innerHTML = `<div class="card bg-dark text-white p-5 animate__animated animate__flipInY "><h3 class="text-white">Game Over. You didn't answer enough questions correctly!</h3> <button type="button" class="btn btn-danger" id="ok-btn">Ok</button></div>`;
      const okBtn = document.getElementById('ok-btn');
        // Event listener for the "Next" button
        okBtn.addEventListener('click', (event) => {
        if (event.target.id === 'ok-btn') {
            window.location.reload();
        }
        }); 
    }
}

// Display the next question in the form of a card
function displayNextQuestion() {
  // Check if we've reached the end of the questions
  if (currentQuestionIndex >= totalQuestions) {
    return endGame();
  }

  const questionData = questions[currentQuestionIndex];
  const questionCard = `
    <div class="card bg-dark text-white p-4 animate__animated animate__slideInLeft">
      <h5 class="card-title">${questionData.question}</h5>
      <form id="question-form-${currentQuestionIndex}">
        <div class="mb-3">
          ${questionData.incorrect_answers.concat(questionData.correct_answer).sort().map((answer, idx) => `
            <div class="form-check">
              <input class="form-check-input" type="radio" name="answer" id="answer${idx}" value="${answer}">
              <label class="form-check-label" for="answer${idx}">
                ${answer}
              </label>
            </div>
          `).join('')}
        </div>
        <button type="button" class="btn btn-success w-100" id="next-btn">Next</button>
      </form>
    </div>
  `;
  userForm.style.display = 'none';
  questionContainerParent.style.display = 'block';
  questionContainer.innerHTML = questionCard;
  
    const nextBtn = document.getElementById('next-btn');
    // Event listener for the "Next" button
    nextBtn.addEventListener('click', (event) => {
    if (event.target.id === 'next-btn') {
        nextQuestion();
    }
    }); 

}

function breakGame(type)
{
  // Hide user form and introduce a delay before the rest of the code
userForm.style.display = 'none';

// Introduce a 2-second delay before proceeding with the next block of code
setTimeout(() => {
  let brk = ''; // Initialize variable for break content

  // Determine break type and create the appropriate HTML content
  if (type === "brk") {
    brk = `<div class="row justify-content-center">
        <div class="col">
          <div class="card bg-dark p-4"><h3 class="text-light">We are at a break right now , <br> Comeback Later !!!</h3>
          <button type="button" class="btn btn-success" id="ok-btn">Ok</button>
          </div>
        </div>
      </div>`;
  } else if (type === "oneTimeDisplay") {
    brk = `<div class="row justify-content-center animate__animated animate__flipInY">
        <div class="col">
          <div class="card bg-dark p-4"><h3 class="text-light">You can only play once a day, Comeback Later !!!</h3>
           <button type="button" class="btn btn-success" id="ok-btn">Ok</button>
          </div>
        </div>
      </div>`;
  } else {
    brk = `<div class="row justify-content-center animate__animated animate__flipInY">
        <div class="col">
          <div class="card bg-dark p-4"><h3 class="text-light">Something went wrong<br> Please try again later !!!</h3>
           <button type="button" class="btn btn-success" id="ok-btn">Ok</button>
          </div>
        </div>
      </div>`;
  }

  // Display the break content after the delay
  breakContainer.style.display = 'block';
  breakContainer.innerHTML = brk;

  // Event listener for the "Ok" button
  const okBtn = document.getElementById('ok-btn');
  okBtn.addEventListener('click', (event) => {
    if (event.target.id === 'ok-btn') {
      window.location.reload(); // Reload the page when "Ok" is clicked
    }
  });

}, 1000); // 2-second delay (2000 milliseconds)

 
}

function checkPlayCount() {
    const today = new Date().toISOString().split('T')[0]; // Get the current date in YYYY-MM-DD format

    let lastPlayedDate = localStorage.getItem('lastPlayedDate');
    let playCount = localStorage.getItem('count');

    // If no play count or last played date exists, initialize them
    if (!playCount || !lastPlayedDate) {
        playCount = 0;
        lastPlayedDate = today;
        localStorage.setItem('lastPlayedDate', lastPlayedDate);
        localStorage.setItem('count', playCount);
    }

    // If the last played date is not today, reset the play count
    if (lastPlayedDate !== today) {
        playCount = 0;
        localStorage.setItem('count', playCount);
        localStorage.setItem('lastPlayedDate', today);  // Update the last played date to today
    }

    // Check if user can play
    if (playCount >= 1) {
         breakGame("oneTimeDisplay");
    }

    // Increment play count and proceed with the game
    playCount++;
    localStorage.setItem('count', playCount);
}

// Prevent rapid clicks globally for all buttons
document.addEventListener('click', function (event) {
    // Check if the clicked element is a button
    if (event.target.tagName === 'BUTTON') {
      const button = event.target;
  
      // Check if the button is already disabled for debounce
      if (button.dataset.clickDisabled === 'true') {
        event.preventDefault(); // Ignore the click
        return;
      }
  
      // Mark the button as temporarily disabled
      button.dataset.clickDisabled = 'true';
  
      // Re-enable the button after 300ms
      setTimeout(() => {
        button.dataset.clickDisabled = 'false';
      }, 300);
    }
  });
  