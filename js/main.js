/* ===========================================================
   SC RUN CLUB  |  main.js
   Menu, acordeão, animações e quiz de inscrição.
   Sem dependências.
   =========================================================== */
(function(){
  "use strict";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Header sólido ao rolar ---------- */
  var header = document.querySelector(".header");
  function onScroll(){
    if (window.scrollY > 24) header.classList.add("is-scrolled");
    else header.classList.remove("is-scrolled");
  }
  window.addEventListener("scroll", onScroll, { passive:true });
  onScroll();

  /* ---------- Menu hambúrguer ---------- */
  var burger = document.querySelector(".burger");
  var mobileNav = document.querySelector(".mobile-nav");
  function closeMenu(){
    if (!burger) return;
    burger.setAttribute("aria-expanded","false");
    mobileNav.classList.remove("is-open");
    document.body.style.overflow = "";
  }
  function toggleMenu(){
    var open = burger.getAttribute("aria-expanded") === "true";
    if (open) { closeMenu(); }
    else {
      burger.setAttribute("aria-expanded","true");
      mobileNav.classList.add("is-open");
      document.body.style.overflow = "hidden";
    }
  }
  if (burger && mobileNav){
    burger.addEventListener("click", toggleMenu);
    mobileNav.querySelectorAll("a").forEach(function(a){
      a.addEventListener("click", closeMenu);
    });
    document.addEventListener("keydown", function(e){
      if (e.key === "Escape") closeMenu();
    });
  }

  /* ---------- Acordeão FAQ ---------- */
  var faqButtons = document.querySelectorAll(".faq__q");
  faqButtons.forEach(function(btn){
    btn.addEventListener("click", function(){
      var expanded = btn.getAttribute("aria-expanded") === "true";
      faqButtons.forEach(function(other){
        other.setAttribute("aria-expanded","false");
        var panel = document.getElementById(other.getAttribute("aria-controls"));
        if (panel) panel.style.maxHeight = null;
      });
      if (!expanded){
        btn.setAttribute("aria-expanded","true");
        var p = document.getElementById(btn.getAttribute("aria-controls"));
        if (p) p.style.maxHeight = p.scrollHeight + "px";
      }
    });
  });

  /* ---------- IntersectionObserver ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)){
    reveals.forEach(function(el){ el.classList.add("is-visible"); });
  } else {
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting){
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function(el){ io.observe(el); });
  }

  /* ---------- Pré-selecionar serviço no formulário de contato ---------- */
  document.querySelectorAll("[data-servico]").forEach(function(link){
    link.addEventListener("click", function(){
      var val = link.getAttribute("data-servico");
      var sel = document.getElementById("contato-assunto");
      if (sel){ sel.value = val; }
    });
  });

  /* ===========================================================
     QUIZ
     =========================================================== */
  var quiz = document.getElementById("quiz");
  if (!quiz) return;

  var screens = Array.prototype.slice.call(quiz.querySelectorAll(".quiz__screen"));
  var bar = quiz.querySelector(".quiz__bar");
  var countEl = quiz.querySelector(".quiz__count");
  var backButtons = Array.prototype.slice.call(quiz.querySelectorAll(".quiz__back"));
  var current = 0;
  var totalQuestions = screens.length - 1; // última tela é confirmação
  var advancing = false;

  function showScreen(i){
    screens.forEach(function(s, idx){
      s.classList.toggle("is-active", idx === i);
    });
    // botão voltar: visível em todas as telas exceto a primeira e a de confirmação
    backButtons.forEach(function(b){
      if (i === 0 || i === totalQuestions) b.classList.remove("show");
      else b.classList.add("show");
    });
    current = i;
    var pct = (i / totalQuestions) * 100;
    if (pct > 100) pct = 100;
    bar.style.width = pct + "%";
    if (i < totalQuestions){
      countEl.textContent = "Pergunta " + (i + 1) + " de " + totalQuestions;
      countEl.style.display = "";
    } else {
      countEl.style.display = "none";
    }
    var focusable = screens[i].querySelector("input:not([type=hidden]), button, [tabindex]");
    if (focusable && i !== 0){ try{ focusable.focus({preventScroll:true}); }catch(e){} }
  }

  /* ----- Máscaras ----- */
  var telInput = document.getElementById("q-telefone");
  if (telInput){
    telInput.addEventListener("input", function(){
      var v = telInput.value.replace(/\D/g, "").slice(0,11);
      var out = "";
      if (v.length > 0) out = "(" + v.slice(0,2);
      if (v.length >= 2) out += ") ";
      if (v.length >= 2) out += v.slice(2,7);
      if (v.length >= 7) out += "-" + v.slice(7,11);
      telInput.value = out;
    });
  }

  var dataInput = document.getElementById("q-nascimento");
  var warn = document.getElementById("q-menor-warn");
  if (dataInput){
    dataInput.addEventListener("input", function(){
      var v = dataInput.value.replace(/\D/g, "").slice(0,8);
      var out = v;
      if (v.length > 2) out = v.slice(0,2) + "/" + v.slice(2);
      if (v.length > 4) out = v.slice(0,2) + "/" + v.slice(2,4) + "/" + v.slice(4);
      dataInput.value = out;
      checkAge();
    });
  }

  function parseDate(str){
    var m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(str);
    if (!m) return null;
    var d = parseInt(m[1],10), mo = parseInt(m[2],10), y = parseInt(m[3],10);
    if (mo < 1 || mo > 12) return null;
    if (d < 1 || d > 31) return null;
    var dt = new Date(y, mo - 1, d);
    if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
    if (y < 1900 || dt > new Date()) return null;
    return dt;
  }
  function ageFrom(dt){
    var t = new Date();
    var a = t.getFullYear() - dt.getFullYear();
    var mm = t.getMonth() - dt.getMonth();
    if (mm < 0 || (mm === 0 && t.getDate() < dt.getDate())) a--;
    return a;
  }
  function checkAge(){
    if (!warn) return;
    var dt = parseDate(dataInput.value);
    if (dt && ageFrom(dt) < 18) warn.classList.add("show");
    else warn.classList.remove("show");
  }

  /* ----- Cards de nível: teclado ----- */
  quiz.querySelectorAll(".level-card").forEach(function(card){
    var radio = card.querySelector("input[type=radio]");
    card.setAttribute("tabindex","0");
    card.setAttribute("role","radio");
    card.setAttribute("aria-checked","false");
    function select(){
      quiz.querySelectorAll(".level-card").forEach(function(c){
        c.classList.remove("is-selected");
        c.setAttribute("aria-checked","false");
      });
      card.classList.add("is-selected");
      card.setAttribute("aria-checked","true");
      radio.checked = true;
      clearError(3);
    }
    card.addEventListener("click", select);
    card.addEventListener("keydown", function(e){
      if (e.key === " " || e.key === "Enter"){ e.preventDefault(); select(); }
      if (e.key === "ArrowDown" || e.key === "ArrowRight"){
        e.preventDefault();
        var n = card.nextElementSibling; if (n && n.classList.contains("level-card")) n.focus();
      }
      if (e.key === "ArrowUp" || e.key === "ArrowLeft"){
        e.preventDefault();
        var p = card.previousElementSibling; if (p && p.classList.contains("level-card")) p.focus();
      }
    });
  });

  /* ----- Validação por tela ----- */
  function setError(i, msg){
    var el = screens[i].querySelector(".quiz__error");
    if (el) el.textContent = msg;
  }
  function clearError(i){ setError(i, ""); }

  function validate(i){
    if (i === 0){
      var nome = document.getElementById("q-nome");
      if (!nome.value.trim()){ setError(0, "Por favor, escreva seu nome completo."); nome.focus(); return false; }
      if (nome.value.trim().split(/\s+/).length < 2){ setError(0, "Escreva nome e sobrenome."); nome.focus(); return false; }
      clearError(0); return true;
    }
    if (i === 1){
      var dt = parseDate(dataInput.value);
      if (!dataInput.value.trim()){ setError(1, "Informe sua data de nascimento."); dataInput.focus(); return false; }
      if (!dt){ setError(1, "Data inválida. Use o formato dia/mês/ano."); dataInput.focus(); return false; }
      clearError(1); return true;
    }
    if (i === 2){
      var tel = telInput.value.replace(/\D/g, "");
      if (!telInput.value.trim()){ setError(2, "Informe seu WhatsApp."); telInput.focus(); return false; }
      if (tel.length < 10){ setError(2, "Telefone incompleto. Use (00) 00000-0000."); telInput.focus(); return false; }
      clearError(2); return true;
    }
    if (i === 3){
      var checked = quiz.querySelector("input[name=nivel]:checked");
      if (!checked){ setError(3, "Escolha o seu nível na corrida."); return false; }
      clearError(3); return true;
    }
    return true; // tela 4 (origem) é opcional
  }

  function next(){
    if (advancing) return;
    if (!validate(current)) return;
    if (current < totalQuestions - 1){
      advancing = true;
      showScreen(current + 1);
      setTimeout(function(){ advancing = false; }, 400);
    } else if (current === totalQuestions - 1){
      submitForm();
    }
  }
  function back(){
    if (current > 0 && current < totalQuestions) showScreen(current - 1);
  }

  quiz.querySelectorAll("[data-next]").forEach(function(b){
    b.addEventListener("click", function(e){ e.preventDefault(); next(); });
  });
  backButtons.forEach(function(b){
    b.addEventListener("click", function(e){ e.preventDefault(); back(); });
  });

  // Enter avança nos campos de texto
  quiz.querySelectorAll("input[type=text], input[type=tel]").forEach(function(inp){
    inp.addEventListener("keydown", function(e){
      if (e.key === "Enter"){ e.preventDefault(); next(); }
    });
  });

  /* ----- Envio Netlify ----- */
  var form = document.getElementById("quiz-form");
  function encode(data){
    return Object.keys(data).map(function(k){
      return encodeURIComponent(k) + "=" + encodeURIComponent(data[k]);
    }).join("&");
  }
  function submitForm(){
    if (advancing) return;
    advancing = true;
    var hp = form.querySelector("[name=bot-field]");
    if (hp && hp.value){ advancing = false; return; } // honeypot preenchido = bot
    var data = {};
    var fd = new FormData(form);
    fd.forEach(function(v, k){ data[k] = v; });
    fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: encode(data)
    }).then(function(){
      showScreen(totalQuestions);
      advancing = false;
    }).catch(function(){
      showScreen(totalQuestions);
      advancing = false;
    });
  }

  showScreen(0);
})();
