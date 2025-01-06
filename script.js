const typingForm=document.querySelector(".typing-form");
const chatList=document.querySelector(".chat-list");
const toggleTheme=document.querySelector("#toggle-theme-button");
const deleteChat=document.querySelector("#delete-chat-button");
const suggestions=document.querySelectorAll(".suggestion-list .suggestion")

const loadLocalstorageData=()=>{
    const savedChats=localStorage.getItem("savedChats");
    const isLightMode=(localStorage.getItem("themeColor")==="light_mode");
    
    // saving the current theme 
    document.body.classList.toggle("light_mode",isLightMode);
    toggleTheme.innerText=isLightMode? "dark_mode":"light_mode";

    // restore saved chats
    chatList.innerHTML=savedChats || "";

    // hide header while sending mssage
    document.body.classList.toggle("hide-header",savedChats);
    
    //scroll to bottom
    chatList.scrollTo(0,chatList.scrollHeight); 
}
loadLocalstorageData();

// sending the prompt
typingForm.addEventListener("submit",(e)=>{
    e.preventDefault();
    handleOutgoingChat();
})

// handling outgoing prompt
let userMessage=null;
let isResoponseIsGenerating=false;
const handleOutgoingChat=()=>{
    userMessage=typingForm.querySelector(".typing-input").value.trim() || userMessage;

    if(!userMessage || isResoponseIsGenerating) return;
    
    isResoponseIsGenerating=true;
    const html=`<div class="message-content">
                    <img src="./img/BM.jpg" alt="User Image" class="avatar">
                    <p class="text">${userMessage}</p>
                </div>`;
    const outgoingMessageDiv=createMessageElement(html,"outgoing");
    chatList.appendChild(outgoingMessageDiv);
    chatList.scrollTo(0,chatList.scrollHeight); //scroll to bottom
    typingForm.reset();
    document.body.classList.add("hide-header");
    setTimeout(showLoadingAnimation,300);

}

// loading animation while loading
const showLoadingAnimation=()=>{
    const html=`<div class="message-content">
                    <img src="./img/gemi-removebg-preview.png" alt="User Image" class="avatar">
                    <p class="text"></p>
                    <div class="loading-indicator">
                        <div class="loading-bar"></div>
                        <div class="loading-bar"></div>
                        <div class="loading-bar"></div>
                    </div>
                </div>
                <span onclick="copyMessage(this)" class="icon material-symbols-rounded">content_copy</span>`;
    const incomingMessageDiv=createMessageElement(html,"incoming","loading");
    chatList.appendChild(incomingMessageDiv);
    chatList.scrollTo(0,chatList.scrollHeight); //scroll to bottom
    generateResponse(incomingMessageDiv);
}

// getting response from the api
const API_KEY="AIzaSyD4dAW7WoOBXcsvOofE_rrfL3GI-B165mE";
const API_URL=`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
const generateResponse=async (incomingMessageDiv)=>{
    const textElement=incomingMessageDiv.querySelector(".text");
    try{
        const response=await fetch(API_URL,{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify({
            contents: [{
                role:"user",
                parts:[{text: userMessage}]
             }]
            })
        });

        const data=await response.json();
        if(!response.ok) throw new Error(data.error.message);

        const apiResponse=data?.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g,'$1');


        showTypingEffect(apiResponse,textElement,incomingMessageDiv);
    }
    catch(error){
        console.log(error);
        textElement.innerText=error.message;
        textElement.classList.add("error");
    }
    finally{
        incomingMessageDiv.classList.remove("loading");
    }
}

// typing effect
const showTypingEffect=(text,textElement,incomingMessageDiv)=>{
    const words=text.split(' ');
    let currentWordIndex=0;

    const typingInterval=setInterval(()=>{
        textElement.innerText+=(currentWordIndex === 0?'':' ')+words[currentWordIndex++];
        incomingMessageDiv.querySelector(".icon").classList.add("hide");


        if(currentWordIndex === words.length){
            clearInterval(typingInterval);
            isResoponseIsGenerating=false;
            incomingMessageDiv.querySelector(".icon").classList.remove("hide");
            localStorage.setItem("savedChats",chatList.innerHTML); //save chats to local storage 
        }
        chatList.scrollTo(0,chatList.scrollHeight); //scroll to bottom
        
    },75);
    
    

}

// copy message feature
const copyMessage=(copyIcon)=>{
    const messageText=copyIcon.parentElement.querySelector(".text").innerText;

    navigator.clipboard.writeText(messageText);
    copyIcon.innerText="done";
    setTimeout(()=> copyIcon.innerText= "content_copy",1000);
}

// toggle dark and light mode
toggleTheme.addEventListener("click",()=>{
    const isLightMode=document.body.classList.toggle("light_mode");
    localStorage.setItem("themeColor",isLightMode? "light_mode":"dark_mode");
    toggleTheme.innerText=isLightMode? "dark_mode":"light_mode";

})

// delete chat feature
deleteChat.addEventListener("click",()=>{
    if(confirm("Are you sure! You want to delete chat")){
        localStorage.removeItem("savedChats");
        loadLocalstorageData();
    }
})

// suggesions working
suggestions.forEach(suggestion =>{
    suggestion.addEventListener("click",()=>{
        userMessage=suggestion.querySelector(".text").innerText;
        handleOutgoingChat();
    });
});

// function to create element for all outgoing incoming and loading
const createMessageElement=(content,...clases)=>{
    const div=document.createElement("div");
    div.classList.add("message",...clases);
    div.innerHTML=content;
    return div;
}