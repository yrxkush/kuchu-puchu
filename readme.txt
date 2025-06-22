# Kuchu Puchu 🌳❤️

An animated, emotional storytelling project created with HTML, CSS, and JavaScript. It features a growing tree, animated hearts, personal images, a countdown timer, and a heartfelt message that types out on screen — all triggered by clicking the center heart.

---

## 🔧 How to Customize

### 1. ⏱️ Edit the Timer Start Time  
- Go to `script.js`
- Find the `startGroundTimer()` function.
- Locate this line:
  ```js
  const startDate = new Date(Date.UTC(enter year, 0, enterdate, 4, 51, 0));

2. 📝 Change the Typewriter Text
Still inside script.js, go to the showTypewriterBox() function.

Locate this line:
showTypewriterBox(`I really appreciate the time we spend together...`, 'boxImage.png');

Replace the text with your custom message.
To add multiple lines, use \n.

3. 🎞️ Change the "Directed by her" Text
In index.html, find this snippet:

<span class="hover-text">Directed by her</span>

Replace the text inside <span> with your own.

4. 🖼️ Change the Image
The typewriter image is loaded using 'boxImage.png'.

Replace the file or edit this line:

showTypewriterBox(`...`, 'boxImage.png');

Use your desired image filename here, or just copy paste any other image with the same name in the project folder.

💡 Tip

To add your own heart images:

Place your images in the project folder as 1.jpg, 2.jpg, 3.jpg, 4.jpg.

These are randomly used in animations.

Made with 💗 by someone who codes with emotion.