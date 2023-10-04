import { darkModeStyles } from './dark-colors.js'
const switcher = document.querySelector("#mode-switcher");
const body = document.querySelector("body")
let currentPage = 1;  
const itemsPerPage = 24; 
let isFetching = false;  
let previousDisplayedCountries = [];


let data = [];
let map

document.querySelector('.flag-container').addEventListener('change', (event) => {
    if (event.target.id === 'continents') {
        populateGrid(data, event.target.value);
    }
});

fetch('./dist/js/flags.json')
    .then(response => response.json())
    .then(fetchedData => {
        data = fetchedData;
        populateGrid(data);

    })
    .catch(error => console.error('Error:', error));



function populateGrid(data, continent = '') {
    const flagContainer = document.querySelector(".flag-container");

    flagContainer.innerHTML = `
        <div class="flag-container__header">
            <input type="text" id="search-bar" placeholder="Search for a country" />
            <select name="continents" id="continents">
                <option selected disabled hidden>Filter by Region</option>
                <option value="Africa">Africa</option>
                <option value="Americas">Americas</option>
                <option value="Asia">Asia</option>
                <option value="Europe">Europe</option>
                <option value="Oceania">Oceania</option>
            </select>
        </div>
        <div class="flag-container__grid">
        </div>
    `;

    const gridContainer = document.querySelector(".flag-container__grid");
    if (currentPage === 1) {
        gridContainer.innerHTML = '';
    }

    const searchBar = document.getElementById('search-bar');
    searchBar.addEventListener('input', function() {
        const searchTerm = this.value.trim();
        let newFilteredData = [];
        if (searchTerm.length >= 2) {
            newFilteredData = data.filter(country => 
                country.name.toLowerCase().startsWith(searchTerm.toLowerCase())
            );
        } else {
            newFilteredData = continent ? data.filter(country => country.region === continent) : data;
        }

        const currentCountryNames = newFilteredData.map(country => country.name);
        if (!arraysAreEqual(currentCountryNames, previousDisplayedCountries)) {
            displayCountries(newFilteredData, continent);
            previousDisplayedCountries = currentCountryNames;
        }
    });
    function arraysAreEqual(arr1, arr2) {
    return arr1.length === arr2.length && arr1.every((value, index) => value === arr2[index]);
}

    function displayCountries(dataToDisplay, continent) {
        let filteredData = continent ? dataToDisplay.filter(country => country.region === continent) : dataToDisplay;
        filteredData = filteredData.slice(0, currentPage * itemsPerPage);

        gridContainer.innerHTML = ''; 

        filteredData.forEach(country => {
            const gridItem = document.createElement('div');
            gridItem.classList.add('flag-container__grid__card');
            const countryPop = country.population;
            const formattedCp = countryPop.toLocaleString();
            gridItem.innerHTML = `
            <article>
                <img src="${country.flags.svg}" alt="${country.name} flag" />
                <div class="content">
                  <h3>${country.name}</h3>
                  <p>Population: <span>${formattedCp}</span></p>
                  <p>Region: <span>${country.region}</span></p>
                  <p>Capital: <span>${country.capital}</span></p>
                </div>
            </article>`;
            gridItem.addEventListener('click', () => {
                showCountryDetails(country);
            });
            gridContainer.appendChild(gridItem);
        });

        const isDark = document.querySelector("body").classList.contains("dark");
        if (isDark) applyDarkMode(true);
        activateScrollEvent();
    }

    displayCountries(data, continent);
}


function showCountryDetails(country) {
    const flagContainer = document.querySelector(".flag-container");
    const neighbors = country.borders?.join(', ') ?? 'No borders';
    const countryPop = country.population;
    const formattedCp = countryPop.toLocaleString();
    const currencyNames = country.currencies.map(currency => currency.name).join(', ');
    const languageNames = country.languages.map(language => language.name).join(', ');

    flagContainer.innerHTML = `
        <div class="flag-container__header">
            <button id="backButton"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M6.46447 4.10744L7.64298 5.28596L3.75389 9.17504L18.6031 9.17504L18.6031 10.825L3.75389 10.825L7.64298 14.714L6.46447 15.8926L0.57191 10L6.46447 4.10744Z" fill="#111517"/>
            </svg> Back</button>
        </div>
        <div class="flag-container__details">
            <img src="${country.flags.svg}" alt="${country.name} flag" />
            <div class="flag-container__details__info">
            <h2>${country.name}</h2>
            <div class="flag-container__details__info__inner">
            <p>Native Name: <span>${country.nativeName}<span></p>
            <p>Population: <span>${formattedCp}</span></p>
            <p>Region: <span>${country.region}</span></p>
            <p>Sub Region: <span>${country.subregion}</span></p>
            <p>Capital: <span>${country.capital}</span></p>
            <p>Top Level Domain: <span>${country.topLevelDomain}</span></p>
            <p>Currencies: <span>${currencyNames}</span></p>
            <p>Languages: <span>${languageNames}</span></p>
            </div>
            <p>Neighbors: ${neighbors}</p>
            </div>
        </div>
        <div id="map" style="width: 100%; height: 400px;"></div>
    `;

    document.querySelector("#backButton").addEventListener('click', () => {
        populateGrid(data);
        activateScrollEvent();
    });
    initMap(country);
    const isDark = document.querySelector("body").classList.contains("dark");
    if (isDark) applyDarkMode(true);
    deactivateScrollEvent();
}

function initMap(country = null) {
    let mapOptions;

    if (country) {
        mapOptions = {
            center: new google.maps.LatLng(country.latlng[0], country.latlng[1]),
            zoom: 6,
            styles: body.classList.contains("dark") ? darkModeStyles : null
        };
    } else {
        mapOptions = {
            center: new google.maps.LatLng(28, 3),
            zoom: 2,
            styles: body.classList.contains("dark") ? darkModeStyles : null
        };
    }

    map = new google.maps.Map(document.getElementById("map"), mapOptions);
}

function activateScrollEvent() {
    window.addEventListener('scroll', handleScrollForPagination);
}

function deactivateScrollEvent() {
    window.removeEventListener('scroll', handleScrollForPagination);
}

function handleScrollForPagination() {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500 && !isFetching) {
        isFetching = true;
        currentPage++;
        populateGrid(data);
        isFetching = false;
    }
}


function applyDarkMode(isDark) {
    if (isDark) {
        switcher.innerHTML = `<svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
      >
      <path d="M12 3V4M12 20V21M4 12H3M6.31412 6.31412L5.5 5.5M17.6859 6.31412L18.5 5.5M6.31412 17.69L5.5 18.5001M17.6859 17.69L18.5 18.5001M21 12H20M16 12C16 14.2091 14.2091 16 12 16C9.79086 16 8 14.2091 8 12C8 9.79086 9.79086 8 12 8C14.2091 8 16 9.79086 16 12Z" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Light Mode`
    } else {
        switcher.innerHTML = `<svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M13.5532 13.815C9.66857 13.815 6.51929 10.9278 6.51929 7.36821C6.51929 6.0253 6.96679 4.78158 7.73143 3.75C4.69036 4.69515 2.5 7.33122 2.5 10.4381C2.5 14.3385 5.94929 17.5 10.2036 17.5C13.5929 17.5 16.4696 15.4932 17.5 12.7045C16.375 13.4048 15.0161 13.815 13.5532 13.815Z"
          fill="transparent"
          stroke="#111517"
          stroke-width="1.25"
        />
      </svg>
      Dark Mode`
    }
    const elementsToToggle = [
        document.querySelector("#mode-switcher"),
        document.querySelector("body"),
        document.querySelector(".main-header"),
        document.querySelector("input"),
        document.querySelector("select"),
        document.querySelector("#backButton"),
        document.querySelector("#map"),
        ...document.querySelectorAll(".flag-container__grid__card"),
        ...document.querySelectorAll("option")
    ];
    elementsToToggle.forEach(el => {
        if (el) el.classList.toggle("dark", isDark);
    });

    if (map) {
        map.setOptions({
            styles: isDark ? darkModeStyles : null
        });
    }
}


switcher.addEventListener("click", function () {
    const isDark = !document.querySelector("body").classList.contains("dark");
    applyDarkMode(isDark);
});