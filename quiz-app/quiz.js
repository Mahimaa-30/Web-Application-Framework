const quizData = {
js: [
{q:"What is closure?", options:["Function with memory","Loop","Variable","None"], answer:0},
{q:"Which keyword declares variable?", options:["var","int","float","char"], answer:0},
{q:"What is NaN?", options:["Not a Number","Number","Null","String"], answer:0},
{q:"Which is not primitive?", options:["Object","String","Number","Boolean"], answer:0},
{q:"typeof null?", options:["object","null","undefined","string"], answer:0},
{q:"Which is ES6 feature?", options:["let","goto","printf","scanf"], answer:0},
{q:"Array method to add?", options:["push","pop","shift","slice"], answer:0},
{q:"Strict equality?", options:["===","==","=","!="], answer:0},
{q:"DOM stands for?", options:["Document Object Model","Data Object Model","Doc Model","None"], answer:0},
{q:"Event listener?", options:["addEventListener","onClick","eventAdd","listen"], answer:0}
],

html: [
{q:"HTML stands for?", options:["Hyper Text Markup Language","High Text","Hyper Tool","None"], answer:0},
{q:"Tag for image?", options:["img","image","src","pic"], answer:0},
{q:"Heading tag?", options:["h1","head","title","p"], answer:0},
{q:"Paragraph tag?", options:["p","para","text","t"], answer:0},
{q:"Link tag?", options:["a","link","href","url"], answer:0},
{q:"List tag?", options:["ul","list","li","ol"], answer:0},
{q:"Break line?", options:["br","break","lb","newline"], answer:0},
{q:"Bold text?", options:["b","bold","strong","bb"], answer:0},
{q:"Table tag?", options:["table","tbl","tr","td"], answer:0},
{q:"Form tag?", options:["form","input","submit","button"], answer:0}
]
};

let questions=[], index=0, score=0, timer;
let userAnswers=[];

function startQuiz(){
    let cat=document.getElementById("category").value;
    questions=[...quizData[cat]].sort(()=>Math.random()-0.5);
    index=0; score=0; userAnswers=[];

    document.getElementById("start").classList.add("hidden");
    document.getElementById("quiz").classList.remove("hidden");

    loadQuestion();
}

function loadQuestion(){
    if(index>=questions.length){ endQuiz(); return; }

    let q=questions[index];
    document.getElementById("question").innerText=q.q;

    let optionsHTML="";
    q.options.forEach((opt,i)=>{
        optionsHTML+=`<button class="option" onclick="selectAnswer(${i})">${opt}</button>`;
    });

    document.getElementById("options").innerHTML=optionsHTML;

    document.getElementById("progress").style.width = ((index/questions.length)*100)+"%";

    startTimer();
}

function startTimer(){
    let time=10;
    document.getElementById("timer").innerText="⏱ "+time;

    clearInterval(timer);
    timer=setInterval(()=>{
        time--;
        document.getElementById("timer").innerText="⏱ "+time;
        if(time<=0){
            clearInterval(timer);
            nextQuestion();
        }
    },1000);
}

function selectAnswer(i){
    clearInterval(timer);

    let correct=questions[index].answer;
    let buttons=document.querySelectorAll(".option");

    buttons.forEach((btn,idx)=>{
        if(idx===correct) btn.classList.add("correct");
        else if(idx===i) btn.classList.add("wrong");
    });

    if(i===correct) score++;

    userAnswers.push({q:questions[index], selected:i});

    setTimeout(()=>nextQuestion(),800);
}

function nextQuestion(){
    index++;
    loadQuestion();
}

function endQuiz(){
    document.getElementById("quiz").classList.add("hidden");
    document.getElementById("result").classList.remove("hidden");

    let percent = (score/questions.length)*100;

    document.getElementById("score").innerText=`Score: ${score}/${questions.length}`;

    let perf = percent>70 ? "Excellent 🎉" : percent>40 ? "Good 👍" : "Needs Improvement ❗";
    document.getElementById("performance").innerText=perf;

    localStorage.setItem("bestScore", Math.max(score, localStorage.getItem("bestScore")||0));
}

function showReview(){
    document.getElementById("result").classList.add("hidden");
    document.getElementById("review").classList.remove("hidden");

    let html="";
    userAnswers.forEach(item=>{
        html+=`
        <div class="review">
            <b>${item.q.q}</b><br>
            Your: ${item.q.options[item.selected] || "No Answer"}<br>
            Correct: ${item.q.options[item.q.answer]}
        </div>`;
    });

    html+=`<button onclick="restart()">Restart</button>`;
    document.getElementById("review").innerHTML=html;
}

function restart(){
    location.reload();
}
