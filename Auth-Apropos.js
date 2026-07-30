// =====================================================================
// AUTHENTIFICATION (connexion / inscription / déconnexion) — page A propos
// Extrait de index.html, sans la logique des cours/paiements.
// =====================================================================

// ---- Stubs : fonctions liées aux cours, non utilisées sur cette page ----
// Elles existent dans index.html mais pas ici. On les remplace par des
// fonctions "vides" pour que le reste du code (identique à index.html)
// fonctionne sans erreur.
function refreshAll(){}
function applyAccessGate(){}
function updateDashboard(){}
function loadPaymentStatus(){ return Promise.resolve(); }
function loadLessonProgress(){ return Promise.resolve(); }
function resumePendingEnskri(){}
var pendingEnskri = null;

// ---- Connexion & accès (Supabase Auth) ----
// Chaque élève a un vrai compte (email + mot de passe personnel).
// Les identifiants sont stockés de façon sécurisée par Supabase, pas dans ce fichier.
var SUPABASE_URL = 'https://lgohbjmbhprvjibkforn.supabase.co';
var SUPABASE_ANON_KEY = 'sb_publishable_EmDRarwrfmft7DGnsWsgXA_LgeJV-sI';
var supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

var loginModal = document.getElementById('loginModal');
var loginForm = document.getElementById('loginForm');
var loginError = document.getElementById('loginError');
var loginSuccess = document.getElementById('loginSuccess');
var loginSubmitBtn = document.getElementById('loginSubmitBtn');
var loginToggleLink = document.getElementById('loginToggleLink');
var loginToggleText = document.getElementById('loginToggleText');
var loginModalTitleEl = document.getElementById('loginModalTitle');
var loginNavBtn = document.getElementById('loginNavBtn');
var loginNavLinkMobile = document.getElementById('loginNavLinkMobile');

var loginMode = 'login'; // ou 'signup'
var currentSession = null;
var lastFocused = null;

function isLoggedIn(){ return !!currentSession; }

function setLoginMode(mode){
  loginMode = mode;
  if(loginError){ loginError.style.display = 'none'; }
  if(loginSuccess){ loginSuccess.style.display = 'none'; }
  if(mode === 'signup'){
    loginModalTitleEl.textContent = 'Créer un compte';
    loginSubmitBtn.textContent = 'Créer mon compte';
    loginToggleText.textContent = 'Déjà un compte ?';
    loginToggleLink.textContent = 'Se connecter';
  } else {
    loginModalTitleEl.textContent = 'Connexion';
    loginSubmitBtn.textContent = 'Se connecter';
    loginToggleText.textContent = 'Pas encore de compte ?';
    loginToggleLink.textContent = 'Créer un compte';
  }
}

function openLoginModal(){
  if(isLoggedIn()){
    logoutUser();
    return;
  }
  lastFocused = document.activeElement;
  setLoginMode('login');
  loginModal.classList.add('open');
  loginModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  var firstInput = loginModal.querySelector('input');
  if(firstInput){ firstInput.focus(); }
}

function closeLoginModal(){
  loginModal.classList.remove('open');
  loginModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  if(lastFocused){ lastFocused.focus(); }
}

function logoutUser(){
  supabaseClient.auth.signOut().then(function(){
    lsSet('ha_remember_me', '0');
    applyAccessGate();
    updateLoginButton();
    loadPaymentStatus();
    loadLessonProgress();
  });
}

function getAccountFullName(){
  if(currentSession && currentSession.user && currentSession.user.user_metadata){
    var meta = currentSession.user.user_metadata;
    var full = ((meta.prenom || '') + ' ' + (meta.nom || '')).trim();
    if(full){ return full; }
  }
  if(currentSession && currentSession.user && currentSession.user.email){
    return currentSession.user.email;
  }
  return '';
}

function getStoredAvatar(){
  try{
    var uid = (currentSession && currentSession.user && currentSession.user.id) || 'anon';
    return localStorage.getItem('ha_avatar_' + uid);
  }catch(e){ return null; }
}

function updateLoginButton(){
  var logged = isLoggedIn();

  if(loginNavBtn){
    loginNavBtn.style.display = logged ? 'none' : '';
  }
  if(loginNavLinkMobile){
    loginNavLinkMobile.textContent = logged ? 'Déconnexion' : 'Connexion';
  }

  var chip = document.getElementById('userChip');
  if(chip){ chip.classList.toggle('active', logged); }
  if(!logged){ closeUserDropdown(); }

  if(logged){
    var fullName = getAccountFullName() || 'Élève';
    var email = (currentSession && currentSession.user && currentSession.user.email) || '';
    var initial = fullName.trim().charAt(0).toUpperCase() || 'É';
    var avatarUrl = getStoredAvatar();

    ['userChipName'].forEach(function(id){
      var el = document.getElementById(id);
      if(el){ el.textContent = fullName; }
    });
    var dropdownName = document.getElementById('userDropdownName');
    if(dropdownName){ dropdownName.textContent = fullName; }
    var dropdownEmail = document.getElementById('userDropdownEmail');
    if(dropdownEmail){ dropdownEmail.textContent = email; }

    [document.getElementById('userChipAvatar'), document.getElementById('profileAvatarPreview'), document.getElementById('drawerAvatar')].forEach(function(el){
      if(!el){ return; }
      if(avatarUrl){
        el.innerHTML = '<img src="' + avatarUrl + '" alt="Photo de profil">';
      } else {
        el.textContent = initial;
      }
    });
    var drawerName = document.getElementById('drawerUserName');
    if(drawerName){ drawerName.textContent = fullName; }
    var drawerEmail = document.getElementById('drawerUserEmail');
    if(drawerEmail){ drawerEmail.textContent = email; }
  }

  var navLinksEl = document.getElementById('navLinks');
  if(navLinksEl){ navLinksEl.classList.toggle('user-logged-in', logged); }

  var dashSection = document.getElementById('dashboard');
  if(dashSection){ dashSection.classList.toggle('active', logged); }

  updateDashboard();
}

function toggleUserDropdown(){
  var dd = document.getElementById('userDropdown');
  var chip = document.getElementById('userChip');
  if(!dd || !chip){ return; }
  var isOpen = dd.classList.toggle('open');
  chip.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
}

function closeUserDropdown(){
  var dd = document.getElementById('userDropdown');
  var chip = document.getElementById('userChip');
  if(dd){ dd.classList.remove('open'); }
  if(chip){ chip.setAttribute('aria-expanded', 'false'); }
}

document.addEventListener('click', function(e){
  var wrap = document.getElementById('userChipWrap');
  if(wrap && !wrap.contains(e.target)){ closeUserDropdown(); }
});

function lsGet(key){ try{ return localStorage.getItem(key); }catch(e){ return null; } }
function lsSet(key, val){ try{ localStorage.setItem(key, val); }catch(e){} }

if(loginToggleLink){
  loginToggleLink.addEventListener('click', function(e){
    e.preventDefault();
    if(loginMode === 'login'){
      closeLoginModal();
      openRegisterModal();
    } else {
      setLoginMode('login');
    }
  });
}

if(loginForm){
  loginForm.addEventListener('submit', function(e){
    e.preventDefault();
    var email = document.getElementById('loginEmail').value.trim();
    var password = document.getElementById('loginPassword').value;
    var rememberMeChecked = !!(document.getElementById('loginRememberMe') && document.getElementById('loginRememberMe').checked);
    if(loginError){ loginError.style.display = 'none'; }
    if(loginSuccess){ loginSuccess.style.display = 'none'; }
    loginSubmitBtn.disabled = true;

    var authCall = loginMode === 'signup'
      ? supabaseClient.auth.signUp({ email: email, password: password })
      : supabaseClient.auth.signInWithPassword({ email: email, password: password });

    authCall.then(function(result){
      loginSubmitBtn.disabled = false;
      if(result.error){
        loginError.textContent = result.error.message;
        loginError.style.display = 'block';
        return;
      }
      if(loginMode === 'signup' && !result.data.session){
        loginSuccess.textContent = 'Compte créé ! Vérifiez votre email pour confirmer votre inscription, puis connectez-vous.';
        loginSuccess.style.display = 'block';
        setLoginMode('login');
        return;
      }
      lsSet('ha_remember_me', rememberMeChecked ? '1' : '0');
      currentSession = result.data.session;
      closeLoginModal();
      applyAccessGate();
      updateLoginButton();
      refreshAll();
      loadPaymentStatus();
      loadLessonProgress();
      resumePendingEnskri();
    });
  });
}

loginModal.addEventListener('click', function(e){
  if(e.target === loginModal){ closeLoginModal(); }
});

var forgotPasswordLink = document.getElementById('forgotPasswordLink');
if(forgotPasswordLink){
  forgotPasswordLink.addEventListener('click', function(e){
    e.preventDefault();
    closeLoginModal();
    openForgotPasswordModal();
  });
}

document.addEventListener('keydown', function(e){
  if(e.key === 'Escape' && loginModal.classList.contains('open')){ closeLoginModal(); }
});

function rememberMeActive(){ return lsGet('ha_remember_me') === '1'; }

supabaseClient.auth.getSession().then(function(result){
  currentSession = result.data.session;
  applyAccessGate();
  updateLoginButton();
  refreshAll();
  loadPaymentStatus();
  loadLessonProgress();
  if(isLoggedIn() && !rememberMeActive()){ startInactivityTimer(); } else { clearInactivityTimers(); }
});

supabaseClient.auth.onAuthStateChange(function(event, session){
  currentSession = session;
  applyAccessGate();
  updateLoginButton();
  refreshAll();
  loadPaymentStatus();
  loadLessonProgress();
  if(isLoggedIn() && !rememberMeActive()){ startInactivityTimer(); } else { clearInactivityTimers(); closeInactivityModal(); }

  if(event === 'PASSWORD_RECOVERY'){
    closeLoginModal();
    closeForgotPasswordModal();
    openResetPasswordModal();
  }
});

// ---- Déconnexion automatique après 10 minutes d'inactivité ----
var INACTIVITY_LIMIT_MS = 10 * 60 * 1000;
var WARNING_DURATION_MS = 60 * 1000;
var inactivityTimeoutId = null;
var countdownIntervalId = null;
var secondsLeft = WARNING_DURATION_MS / 1000;

var inactivityModal = document.getElementById('inactivityModal');
var inactivityCountdownEl = document.getElementById('inactivityCountdown');
var stayLoggedInBtn = document.getElementById('stayLoggedInBtn');
var logoutNowBtn = document.getElementById('logoutNowBtn');

function clearInactivityTimers(){
  if(inactivityTimeoutId){ clearTimeout(inactivityTimeoutId); inactivityTimeoutId = null; }
  if(countdownIntervalId){ clearInterval(countdownIntervalId); countdownIntervalId = null; }
}

function startInactivityTimer(){
  clearInactivityTimers();
  if(!isLoggedIn()){ return; }
  inactivityTimeoutId = setTimeout(showInactivityWarning, INACTIVITY_LIMIT_MS - WARNING_DURATION_MS);
}

function showInactivityWarning(){
  if(!isLoggedIn()){ return; }
  secondsLeft = WARNING_DURATION_MS / 1000;
  if(inactivityCountdownEl){ inactivityCountdownEl.textContent = secondsLeft; }
  if(inactivityModal){
    inactivityModal.classList.add('open');
    inactivityModal.setAttribute('aria-hidden', 'false');
  }
  countdownIntervalId = setInterval(function(){
    secondsLeft -= 1;
    if(inactivityCountdownEl){ inactivityCountdownEl.textContent = Math.max(secondsLeft, 0); }
    if(secondsLeft <= 0){
      clearInterval(countdownIntervalId);
      countdownIntervalId = null;
      autoLogoutForInactivity();
    }
  }, 1000);
}

function closeInactivityModal(){
  if(inactivityModal){
    inactivityModal.classList.remove('open');
    inactivityModal.setAttribute('aria-hidden', 'true');
  }
}

function autoLogoutForInactivity(){
  closeInactivityModal();
  clearInactivityTimers();
  supabaseClient.auth.signOut().then(function(){
    applyAccessGate();
    updateLoginButton();
    alert("Vous avez été déconnecté automatiquement après 10 minutes d'inactivité.");
  });
}

if(stayLoggedInBtn){
  stayLoggedInBtn.addEventListener('click', function(){
    closeInactivityModal();
    startInactivityTimer();
  });
}

if(logoutNowBtn){
  logoutNowBtn.addEventListener('click', function(){
    autoLogoutForInactivity();
  });
}

['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'].forEach(function(evtName){
  document.addEventListener(evtName, function(){
    if(isLoggedIn() && (!inactivityModal || !inactivityModal.classList.contains('open'))){
      startInactivityTimer();
    }
  }, { passive: true });
});

// ---- Modale : mot de passe oublié ----
var forgotPasswordModal = document.getElementById('forgotPasswordModal');
var forgotPasswordForm = document.getElementById('forgotPasswordForm');
var forgotPasswordEmail = document.getElementById('forgotPasswordEmail');
var forgotPasswordError = document.getElementById('forgotPasswordError');
var forgotPasswordSuccess = document.getElementById('forgotPasswordSuccess');
var forgotPasswordSubmitBtn = document.getElementById('forgotPasswordSubmitBtn');
var forgotPasswordBackLink = document.getElementById('forgotPasswordBackLink');

function openForgotPasswordModal(){
  if(forgotPasswordError){ forgotPasswordError.style.display = 'none'; }
  if(forgotPasswordSuccess){ forgotPasswordSuccess.style.display = 'none'; }
  if(forgotPasswordForm){ forgotPasswordForm.reset(); }
  forgotPasswordModal.classList.add('open');
  forgotPasswordModal.setAttribute('aria-hidden', 'false');
  if(forgotPasswordEmail){ forgotPasswordEmail.focus(); }
}

function closeForgotPasswordModal(){
  forgotPasswordModal.classList.remove('open');
  forgotPasswordModal.setAttribute('aria-hidden', 'true');
}

if(forgotPasswordForm){
  forgotPasswordForm.addEventListener('submit', function(e){
    e.preventDefault();
    var email = forgotPasswordEmail.value.trim();
    if(forgotPasswordError){ forgotPasswordError.style.display = 'none'; }
    if(forgotPasswordSuccess){ forgotPasswordSuccess.style.display = 'none'; }
    forgotPasswordSubmitBtn.disabled = true;

    var redirectTo = window.location.origin + window.location.pathname;
    supabaseClient.auth.resetPasswordForEmail(email, { redirectTo: redirectTo }).then(function(result){
      forgotPasswordSubmitBtn.disabled = false;
      if(result.error){
        forgotPasswordError.textContent = result.error.message;
        forgotPasswordError.style.display = 'block';
        return;
      }
      forgotPasswordSuccess.textContent = 'Si un compte existe avec cet email, un lien de réinitialisation vient de vous être envoyé. Vérifiez votre boîte mail (et vos spams).';
      forgotPasswordSuccess.style.display = 'block';
      forgotPasswordForm.reset();
    });
  });
}

if(forgotPasswordBackLink){
  forgotPasswordBackLink.addEventListener('click', function(e){
    e.preventDefault();
    closeForgotPasswordModal();
    openLoginModal();
  });
}

forgotPasswordModal.addEventListener('click', function(e){
  if(e.target === forgotPasswordModal){ closeForgotPasswordModal(); }
});

document.addEventListener('keydown', function(e){
  if(e.key === 'Escape' && forgotPasswordModal.classList.contains('open')){ closeForgotPasswordModal(); }
});

// ---- Modale : choisir un nouveau mot de passe ----
var resetPasswordModal = document.getElementById('resetPasswordModal');
var resetPasswordForm = document.getElementById('resetPasswordForm');
var resetPasswordNew = document.getElementById('resetPasswordNew');
var resetPasswordConfirm = document.getElementById('resetPasswordConfirm');
var resetPasswordError = document.getElementById('resetPasswordError');
var resetPasswordSuccess = document.getElementById('resetPasswordSuccess');
var resetPasswordSubmitBtn = document.getElementById('resetPasswordSubmitBtn');

function openResetPasswordModal(){
  if(resetPasswordError){ resetPasswordError.style.display = 'none'; }
  if(resetPasswordSuccess){ resetPasswordSuccess.style.display = 'none'; }
  if(resetPasswordForm){ resetPasswordForm.reset(); }
  resetPasswordModal.classList.add('open');
  resetPasswordModal.setAttribute('aria-hidden', 'false');
  if(resetPasswordNew){ resetPasswordNew.focus(); }
}

function closeResetPasswordModal(){
  resetPasswordModal.classList.remove('open');
  resetPasswordModal.setAttribute('aria-hidden', 'true');
}

if(resetPasswordForm){
  resetPasswordForm.addEventListener('submit', function(e){
    e.preventDefault();
    var pw1 = resetPasswordNew.value;
    var pw2 = resetPasswordConfirm.value;
    if(resetPasswordError){ resetPasswordError.style.display = 'none'; }
    if(resetPasswordSuccess){ resetPasswordSuccess.style.display = 'none'; }

    if(pw1 !== pw2){
      resetPasswordError.textContent = 'Les deux mots de passe ne correspondent pas.';
      resetPasswordError.style.display = 'block';
      return;
    }
    if(pw1.length < 6){
      resetPasswordError.textContent = 'Le mot de passe doit contenir au moins 6 caractères.';
      resetPasswordError.style.display = 'block';
      return;
    }

    resetPasswordSubmitBtn.disabled = true;
    supabaseClient.auth.updateUser({ password: pw1 }).then(function(result){
      resetPasswordSubmitBtn.disabled = false;
      if(result.error){
        resetPasswordError.textContent = result.error.message;
        resetPasswordError.style.display = 'block';
        return;
      }
      resetPasswordSuccess.textContent = 'Votre mot de passe a bien été mis à jour !';
      resetPasswordSuccess.style.display = 'block';
      resetPasswordForm.reset();
      setTimeout(function(){
        closeResetPasswordModal();
        applyAccessGate();
        updateLoginButton();
        refreshAll();
      }, 1800);
    });
  });
}

// ---- Modal d'inscription (création de compte élève — Supabase Auth) ----
var registerModal = document.getElementById('registerModal');
var registerForm = document.getElementById('registerForm');
var registerError = document.getElementById('registerError');
var registerSuccess = document.getElementById('registerSuccess');
var registerSubmitBtn = document.getElementById('registerSubmitBtn');
var registerToLoginLink = document.getElementById('registerToLoginLink');
var lastFocusedRegister = null;

function openRegisterModal(){
  if(isLoggedIn()){
    return;
  }
  lastFocusedRegister = document.activeElement;
  if(registerError){ registerError.style.display = 'none'; }
  if(registerSuccess){ registerSuccess.style.display = 'none'; }
  registerModal.classList.add('open');
  registerModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  var firstInput = registerModal.querySelector('input');
  if(firstInput){ firstInput.focus(); }
}

function closeRegisterModal(){
  registerModal.classList.remove('open');
  registerModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  if(lastFocusedRegister){ lastFocusedRegister.focus(); }
}

if(registerToLoginLink){
  registerToLoginLink.addEventListener('click', function(e){
    e.preventDefault();
    closeRegisterModal();
    setLoginMode('login');
    openLoginModal();
  });
}

if(registerForm){
  registerForm.addEventListener('submit', function(e){
    e.preventDefault();

    var prenom = document.getElementById('regPrenom').value.trim();
    var nom = document.getElementById('regNom').value.trim();
    var telephone = document.getElementById('regTelephone').value.trim();
    var email = document.getElementById('regEmail').value.trim();
    var password = document.getElementById('regPassword').value;
    var passwordConfirm = document.getElementById('regPasswordConfirm').value;
    var privacyAccepted = document.getElementById('regPrivacyCheck').checked;

    if(registerError){ registerError.style.display = 'none'; }
    if(registerSuccess){ registerSuccess.style.display = 'none'; }

    if(password !== passwordConfirm){
      registerError.textContent = 'Les mots de passe ne correspondent pas.';
      registerError.style.display = 'block';
      return;
    }
    if(!privacyAccepted){
      registerError.textContent = 'Vous devez accepter la politique de confidentialité pour continuer.';
      registerError.style.display = 'block';
      return;
    }

    registerSubmitBtn.disabled = true;
    registerSubmitBtn.textContent = 'Création en cours...';

    supabaseClient.auth.signUp({
      email: email,
      password: password,
      options: {
        emailRedirectTo: 'https://high-academy.github.io/AcademyPlus/',
        data: {
          prenom: prenom,
          nom: nom,
          telephone: telephone
        }
      }
    }).then(function(result){
      registerSubmitBtn.disabled = false;
      registerSubmitBtn.textContent = "S'inscrire";

      if(result.error){
        registerError.textContent = result.error.message;
        registerError.style.display = 'block';
        return;
      }

      if(!result.data.session){
        registerSuccess.textContent = 'Compte créé ! Vérifiez votre email pour confirmer votre inscription, puis connectez-vous.';
        registerSuccess.style.display = 'block';
        registerForm.reset();
        return;
      }

      currentSession = result.data.session;
      closeRegisterModal();
      applyAccessGate();
      updateLoginButton();
      refreshAll();
      loadPaymentStatus();
      loadLessonProgress();
      resumePendingEnskri();
    });
  });
}

registerModal.addEventListener('click', function(e){
  if(e.target === registerModal){ closeRegisterModal(); }
});

document.addEventListener('keydown', function(e){
  if(e.key === 'Escape' && registerModal.classList.contains('open')){ closeRegisterModal(); }
});

  // ================= THÈME (clair / sombre) =================
  function applyTheme(theme){
    document.body.classList.toggle('theme-dark', theme === 'dark');
    var btnLight = document.getElementById('themeBtnLight');
    var btnDark = document.getElementById('themeBtnDark');
    if(btnLight){ btnLight.classList.toggle('active', theme !== 'dark'); }
    if(btnDark){ btnDark.classList.toggle('active', theme === 'dark'); }
    try{ localStorage.setItem('ha_theme', theme); }catch(e){}
  }
  (function(){
    var savedTheme = 'light';
    try{ savedTheme = localStorage.getItem('ha_theme') || 'light'; }catch(e){}
    applyTheme(savedTheme);
  })();
