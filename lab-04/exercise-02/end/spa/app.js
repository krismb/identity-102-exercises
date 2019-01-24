window.onload = async function() {
  // UI/DOM elements
  const content = document.getElementById('content');
  const loadingIndicator = document.getElementById('loading-indicator');
  const loginButton = document.getElementById('log-in');
  const expensesContainer = document.getElementById('expenses-container');
  const expensesList = document.getElementById('expenses-list');
  const fetchTokenButton = document.getElementById('fetch-token');
  const logoutButton = document.getElementById('log-out');
  const profile = document.getElementById('profile');
  const profilePicture = document.getElementById('profile-picture');
  const userFullname = document.getElementById('user-fullname');
  const userEmail = document.getElementById('user-email');

  // configuring the Auth0 library
  const auth0Client = new Auth0Login({
    domain: 'labs102-bk.auth0.com',
    client_id: 'AT6YZLCKQu1llsqoE55TfEBHsITyvZIf'
  });

  // there is no need to call `init` when the request is a callback from Auth0
  if (window.location.hash === '#callback') {
    await auth0Client.handleRedirectCallback();
    await renderContent();
    window.history.replaceState({}, document.title, '/');
  } else {
    // if it is not a callback, then we check if there is a session at Auth0
    await auth0Client.init();
    await renderContent();
  }

  // making the login button redirect users to the Auth0 Login Page
  loginButton.onclick = async () => {
    await auth0Client.loginWithRedirect({
      redirect_uri: 'http://localhost:5000/#callback'
    });
  };

  // making the logout button terminate the session at Auth0
  logoutButton.onclick = () => {
    auth0Client.logout({
      client_id: 'AT6YZLCKQu1llsqoE55TfEBHsITyvZIf',
      returnTo: 'http://localhost:5000/'
    });
  };

  // making the "fetch expenses" button get an access token and load the expenses from the API
  fetchTokenButton.onclick = async () => {
    const expensesAPIOptions = {
      audience: 'https://expenses-api',
      scope: 'read:reports',
      silentOnly: false,
      redirect_uri: 'http://localhost:5000/#callback'
    };

    await auth0Client.loginWithPopup(expensesAPIOptions);
    const token = await auth0Client.getToken(expensesAPIOptions);

    const response = await fetch('http://localhost:3001/', {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Authorization': `Bearer ${token}`
      },
    });

    const expenses = await response.json();

    expenses.forEach(expense => {
      const newItem = document.createElement('li');
      const newItemDescription = document.createTextNode(`$ ${expense.value.toFixed(2)} - ${expense.description}`);
      newItem.appendChild(newItemDescription);
      expensesList.appendChild(newItem);
    });
    expensesContainer.style.display = 'block';
  };

  // if the user is logged in, shows their profile; otherwise, show the login button
  async function renderContent() {
    const isAuthenticated = await auth0Client.isAuthenticated();
    if (!isAuthenticated) {
      content.style.display = 'block';
      loadingIndicator.style.display = 'none';
      return;
    }

    const user = await auth0Client.getUser();
    profilePicture.src = user.picture;
    userFullname.innerText = user.name;
    userEmail.innerText = user.email;
    profile.style.display = 'block';
    loginButton.style.display = 'none';
    fetchTokenButton.style.display = 'inline-block';
    logoutButton.style.display = 'inline-block';
    content.style.display = 'block';
    loadingIndicator.style.display = 'none';
  }
};
