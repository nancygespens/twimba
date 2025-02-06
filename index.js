// Import initial tweets data and the uuid generator for unique IDs.
import { tweetsData } from './data.js'
import { v4 as uuidv4 } from 'https://jspm.dev/uuid';

// Use localStorage data if available; otherwise, use the default tweetsData.
let tweets = JSON.parse(localStorage.getItem('tweetsData')) || tweetsData;

// Global object to track which tweet reply areas are currently open.
let openReplyAreas = {};

// Utility function to save the current tweets array to localStorage.
function saveToLocalStorage() {
  localStorage.setItem('tweetsData', JSON.stringify(tweets));
}

// Global click event listener to handle various actions.
document.addEventListener('click', function(e){
  if(e.target.dataset.like){
    handleLikeClick(e.target.dataset.like);
  } else if(e.target.dataset.retweet){
    handleRetweetClick(e.target.dataset.retweet);
  } else if(e.target.dataset.reply){
    // Toggle the reply input area visibility.
    handleReplyClick(e.target.dataset.reply);
  } else if(e.target.dataset.submitReply){
    handleSubmitReply(e.target.dataset.submitReply);
  } else if(e.target.dataset.delete){
    handleDeleteTweet(e.target.dataset.delete);
  }
  // For deleting a reply, we use data attributes for tweet id and reply index.
  else if(e.target.dataset.tweetId && e.target.dataset.replyIndex !== undefined){
    handleDeleteReply(e.target.dataset.tweetId, e.target.dataset.replyIndex);
  } else if(e.target.id === 'tweet-btn'){
    handleTweetBtnClick();
  }
});

// Handle "like" button click: toggle like state and update count.
function handleLikeClick(tweetId){ 
  const targetTweetObj = tweets.filter(tweet => tweet.uuid === tweetId)[0];
  if (targetTweetObj.isLiked){
    targetTweetObj.likes--;
  } else {
    targetTweetObj.likes++;
  }
  targetTweetObj.isLiked = !targetTweetObj.isLiked;
  saveToLocalStorage(); // Save the updated data.
  render();
}

// Handle "retweet" button click: toggle retweet state and update count.
function handleRetweetClick(tweetId){
  const targetTweetObj = tweets.filter(tweet => tweet.uuid === tweetId)[0];
  if(targetTweetObj.isRetweeted){
    targetTweetObj.retweets--;
  } else {
    targetTweetObj.retweets++;
  }
  targetTweetObj.isRetweeted = !targetTweetObj.isRetweeted;
  saveToLocalStorage(); // Save the updated data.
  render();
}

// Toggle the reply input area open or closed.
function handleReplyClick(tweetId){
  if(openReplyAreas[tweetId]){
    // If already open, remove it to close the area.
    delete openReplyAreas[tweetId];
  } else {
    // Otherwise, set it to open.
    openReplyAreas[tweetId] = true;
  }
  render();
}

// Handle the submission of a reply for a tweet.
function handleSubmitReply(tweetId){
  const replyInput = document.getElementById(`reply-text-${tweetId}`);
  const replyText = replyInput.value.trim();

  if(replyText){
    // Find the tweet being replied to.
    const targetTweetObj = tweets.filter(tweet => tweet.uuid === tweetId)[0];
    // Insert the new reply at the beginning so it appears at the top.
    targetTweetObj.replies.unshift({
      handle: `@Scrimba`,
      profilePic: `images/scrimbalogo.png`,
      tweetText: replyText
    });
    saveToLocalStorage(); // Save the updated data.
    replyInput.value = ''; // Clear the reply input but keep the area open.
    render();
  }
}

// Handle new tweet submission from the input field.
function handleTweetBtnClick(){
  const tweetInput = document.getElementById('tweet-input');

  if(tweetInput.value.trim()){
    tweets.unshift({
      handle: `@Scrimba`,
      profilePic: `images/scrimbalogo.png`,
      likes: 0,
      retweets: 0,
      tweetText: tweetInput.value,
      replies: [],
      isLiked: false,
      isRetweeted: false,
      uuid: uuidv4()
    });
    saveToLocalStorage(); // Save the new tweet.
    render();
    tweetInput.value = '';
  }
}

// Handle tweet deletion (only if the tweet's handle is @Scrimba).
function handleDeleteTweet(tweetId){
  tweets = tweets.filter(tweet => tweet.uuid !== tweetId || tweet.handle !== '@Scrimba');
  saveToLocalStorage(); // Save the updated data.
  render();
}

// Handle deletion of a reply (only if the reply's handle is @Scrimba).
function handleDeleteReply(tweetId, replyIndex){
  const targetTweetObj = tweets.filter(tweet => tweet.uuid === tweetId)[0];
  replyIndex = Number(replyIndex); // Convert the replyIndex to a number.
  if(targetTweetObj && targetTweetObj.replies[replyIndex].handle === '@Scrimba'){
    targetTweetObj.replies.splice(replyIndex, 1);
    saveToLocalStorage(); // Save the updated data.
    render();
  }
}

// Build the HTML for the entire tweet feed.
function getFeedHtml(){
  let feedHtml = ``;
  
  tweets.forEach(function(tweet){
    // Determine icon classes based on like and retweet status.
    let likeIconClass = tweet.isLiked ? 'liked' : '';
    let retweetIconClass = tweet.isRetweeted ? 'retweeted' : '';
    
    // Build the HTML for the replies for this tweet.
    let repliesHtml = '';
    tweet.replies.forEach(function(reply, index){
      repliesHtml += `
<div class="tweet-reply">
  <div class="tweet-inner">
    <img src="${reply.profilePic}" class="profile-pic" alt="Profile Picture">
    <div>
      <p class="handle">${reply.handle}</p>
      <!-- Wrap reply text and delete icon in a flex container -->
      <div class="reply-text-area">
        <p class="tweet-text">${reply.tweetText}</p>
        ${reply.handle === '@Scrimba' ? `<i class="fa-solid fa-trash delete-icon" data-tweet-id="${tweet.uuid}" data-reply-index="${index}"></i>` : ''}
      </div>
    </div>
  </div>
</div>
`;
    });
    
    // Determine if the reply input area and replies container should be visible.
    const replyAreaClass = openReplyAreas[tweet.uuid] ? '' : 'hidden';
    
    feedHtml += `
<div class="tweet">
  <div class="tweet-inner">
    <img src="${tweet.profilePic}" class="profile-pic" alt="Profile Picture">
    <div>
      <p class="handle">${tweet.handle}</p>
      <p class="tweet-text">${tweet.tweetText}</p>
      <!-- Tweet action buttons: reply, like, retweet, and delete (if applicable) -->
      <div class="tweet-details">
        <span class="tweet-detail">
          <i class="fa-regular fa-comment-dots" data-reply="${tweet.uuid}"></i>
          ${tweet.replies.length}
        </span>
        <span class="tweet-detail">
          <i class="fa-solid fa-heart ${likeIconClass}" data-like="${tweet.uuid}"></i>
          ${tweet.likes}
        </span>
        <span class="tweet-detail">
          <i class="fa-solid fa-retweet ${retweetIconClass}" data-retweet="${tweet.uuid}"></i>
          ${tweet.retweets}
        </span>
        ${tweet.handle === '@Scrimba' ? `
        <span class="tweet-detail">
          <i class="fa-solid fa-trash delete-icon" data-delete="${tweet.uuid}"></i>
        </span>
        ` : ''}
      </div>   
    </div>            
  </div>
  <!-- Reply input area (positioned above the replies) -->
  <div class="reply-input-area ${replyAreaClass}" id="reply-input-${tweet.uuid}">
    <textarea placeholder="Write your reply..." id="reply-text-${tweet.uuid}"></textarea>
    <button data-submit-reply="${tweet.uuid}">Reply</button>
  </div>
  <!-- Replies container -->
  <div class="${replyAreaClass}" id="replies-${tweet.uuid}">
    ${repliesHtml}
  </div>   
</div>
`;
  });
  return feedHtml;
}

// Render the feed into the DOM.
function render(){
  document.getElementById('feed').innerHTML = getFeedHtml();
}

// Initial render when the page loads.
render();