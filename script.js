
//Выбор страны
const btnOkCountry = document.querySelector(".ok-country-btn");
const btnReadyFlights = document.querySelector(".ok-dates-btn");
const countryOrigin = document.getElementById("country-origin");
const countryDestination = document.getElementById("country-destination");
//Первый раздел (section)
const flagsPlane = document.querySelector(".flags-and-plane");
const placeholderAfterSelectors = document.querySelector(
  ".placeholder-after-selectors"
);
//Второй раздел
const mapAlert = document.querySelector(".map-alert");
const mapContainer = document.getElementById("mapid");
//Третий раздел
const flightsPrices = document.querySelector(".flights-container");
const ticketsOutput = document.querySelector(".tickets-output");

//Медленный скролл
document.querySelector(".ul-nav").addEventListener("click", function (e) {
  e.preventDefault();

  if (e.target.classList.contains("a-nav")) {
    const id = e.target.getAttribute("href");
    document.querySelector(id).scrollIntoView({ behavior: "smooth" });
  }
});

let map;
btnOkCountry.addEventListener("click", function (e) {
  e.preventDefault();

  //Очищаем предыдущую карту и содержимое контейнеров
  ticketsOutput.innerHTML = "";
  flagsPlane.innerHTML = "";
  placeholderAfterSelectors.innerHTML = "";
  mapAlert.innerHTML = "";
  if (map) map.remove();
  ticketsOutput.classList.add("hidden");

  //Возможные опечатки/ошибки: повторяющаяся страна или falsy value
  const htmlSameCountry = `<h2>Вы выбрали путешествие в пределах одной страны, а мы специализируемся на данных о зарубежных поездках 🙁🛫 </h2>`;
  if (countryOrigin.value === "0" || countryDestination.value === "0") return;
  if (countryDestination.value === countryOrigin.value) {
    placeholderAfterSelectors.insertAdjacentHTML("afterbegin", htmlSameCountry);
    return;
  }


  //Вставить картинку с флагами и самолётом
  const htmlFlagsPlane = `<h2>Отличный выбор! Ниже вы найдёте информацию о стране прибытия 😀</h2>
  <div class="flags" style="position:relative">
  <img src="https://countryflagsapi.com/svg/${countryOrigin.value.toLowerCase()}" style="position:absolute; top:0px; height:40px; width:60px" />
  <img src="images/planefinal.png" style="height:300px;margin-left:60px;" />
  <img src="https://countryflagsapi.com/svg/${countryDestination.value.toLowerCase()}" style="margin-top:20px; height:40px; width:60px" />
  <style>
  #general-section {
    padding: 15px 30px;
    border: #97b6be 1px solid;  
  }
  .chooseCountries {
    padding-bottom: 15px;
  }
  #mapid {
    height: 640px;
    margin-bottom: 25px;
  }
  </style>
  </div>`;
  flagsPlane.insertAdjacentHTML("afterbegin", htmlFlagsPlane);

  //Медленный скролл
  document
    .querySelector(".flags-and-plane")
    .scrollIntoView({ behavior: "smooth" });

  //Найти координаты и часовые пояса обеих стран
  let coordsArray = [];
  let timezone1;
  let timezone2;
  let distanceBetweenCoords;
  (async function () {
    try {
      let res = await fetch(
        `https://restcountries.com/v3.1/alpha/${countryOrigin.value.toLowerCase()}`
      );
      if (!res.ok) throw new Error(`Country not found (${res.status})`);
      let resp = await res.json();
      const latlng1 = await resp[0].latlng;
      coordsArray.push(latlng1);
      let timezone = await resp[0].timezones;
      if (timezone[4] !== "0") {
        timezone1 = timezone[0].slice(4, 6);
      } else {
        timezone1 = timezone[0].slice(5, 6);
      }
      if (timezone[3] === "-") timezone1 = "-" + timezone1;
      if (countryOrigin.value === "DK") timezone1 = 1;

      res = await fetch(
        `https://restcountries.com/v3.1/alpha/${countryDestination.value.toLowerCase()}`
      );
      if (!res.ok) throw new Error(`Country not found (${res.status})`);
      resp = await res.json();
      const latlng2 = await resp[0].latlng;
      coordsArray.push(latlng2);
      timezone = await resp[0].timezones;
      if (timezone[4] !== "0") {
        timezone2 = timezone[0].slice(4, 6);
      } else {
        timezone2 = timezone[0].slice(5, 6);
      }
      if (timezone[3] === "-") timezone2 = "-" + timezone2;
      if (countryDestination.value === "DK") timezone2 = 1;
    } catch (err) {
      console.error(err.message);
    }

    //Рассчитать расстояние между парой координат
    function getDistanceFromLatLonInKm([[lat1, lon1], [lat2, lon2]]) {
      var R = 6371; // Radius of the earth in km
      var dLat = deg2rad(lat2 - lat1); // deg2rad below
      var dLon = deg2rad(lon2 - lon1);
      var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) *
          Math.cos(deg2rad(lat2)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      var d = R * c; // Distance in km
      return d;
    }

    function deg2rad(deg) {
      return deg * (Math.PI / 180);
    }

    distanceBetweenCoords = getDistanceFromLatLonInKm(coordsArray);
    const flightTime = distanceBetweenCoords / 840 + 0.5;

    function timeConvert(num) {
      var hours = Math.floor(num);
      var minutes = Math.floor((num * 60) % 60);
      return hours + " ч. " + minutes + " мин.";
    }

    const hrsMinsTime = timeConvert(flightTime);
    //✈️
    const htmlFlightTime = `<h3>🕒 В среднем, прямой перелёт между двумя странами займёт приблизительно <span class="blue-coloured">${hrsMinsTime}</span></h3>`;
    placeholderAfterSelectors.insertAdjacentHTML("beforeend", htmlFlightTime);

  //Назвать национальную валюту страны, площадь, население и граничащие страны.
  let currencyDestination;
  let areaDestination;
  let populationDestination;
  let capital;
  (async function () {
    try {
      let res = await fetch(
        `https://restcountries.com/v2/alpha/${countryDestination.value.toLowerCase()}`
      );
      if (!res.ok) throw new Error(`Country not found (${res.status})`);
      let resp = await res.json();
      currencyDestination = await resp.currencies[0].name;
      areaDestination = await resp.area;
      populationDestination = await resp.population;
      capital = await resp.capital;
    } catch (err) {
      console.error(err.message);
    }

    //Назвать столицу страны
    const htmlCapital = `<h3>🌆 Столица страны прибытия - <span class="blue-coloured">${capital}</span>.</h3>`;
    placeholderAfterSelectors.insertAdjacentHTML("beforeend", htmlCapital);
    //Назвать площадь и население страны приезда
    const htmlAreaPopulation = `<h3>🗾 Площадь - <span class="blue-coloured">${areaDestination} км²</span>.</h3>
    <h3>👫 Население - <span class="blue-coloured">${populationDestination} чел</span>.</h3>`;
    placeholderAfterSelectors.insertAdjacentHTML(
      "beforeend",
      htmlAreaPopulation
    );
    //Назвать валюту
    const htmlCurrency = `<h3>💵 Национальная валюта - <span class="blue-coloured">${currencyDestination}</span>.</h3>`;
    placeholderAfterSelectors.insertAdjacentHTML("beforeend", htmlCurrency);
  })();

  //////КАРТА////////////////////////////
  //Отобразить карту
    map = L.map("mapid").setView(coordsArray[0], 13);

    /*L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);*/

    L.tileLayer(
      "https://{s}.tile.jawg.io/jawg-streets/{z}/{x}/{y}{r}.png?access-token=vk1VcDoODxY0kxhnqvxZPKTJ5aXHlaCbClioG0SteaiyLxYdF4cBia0f14BKwNJW",
      {
        attribution:
          '<a href="http://jawg.io" title="Tiles Courtesy of Jawg Maps" target="_blank">&copy; <b>Jawg</b>Maps</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        minZoom: 0,
        maxZoom: 22,
        subdomains: "abcd",
        accessToken:
          "vk1VcDoODxY0kxhnqvxZPKTJ5aXHlaCbClioG0SteaiyLxYdF4cBia0f14BKwNJW",
      }
    ).addTo(map);

    //Создать маркеры (отметки геопозиции в форме капли)
    L.marker(coordsArray[0])
      .addTo(map)
      .bindPopup(
        L.popup({
          closeOnClick: false,
          autoClose: false,
        }).setContent("Отправление")
      )
      .openPopup();
    L.marker(coordsArray[1])
      .addTo(map)
      .bindPopup(
        L.popup({
          closeOnClick: false,
          autoClose: false,
        }).setContent("Прибытие")
      )
      .openPopup();

    //Создать линию, соединяющую маршрут
    var polyline = L.polyline(coordsArray, { color: "red" }).addTo(map);
    map.fitBounds(polyline.getBounds());

    //Рассчитать разницу часовых поясов
    let differenceTimeZones;
    differenceTimeZones = timezone1 - timezone2;
    let htmlTimeZones;
    let htmlTimeZonesUkraine = "";
    if (differenceTimeZones === 0) {
      htmlTimeZones = `<h3>🌐 По прилёту в указанную страну <span class="blue-coloured">не нужно будет переводить время</span>.</h3>`;
    } else if (differenceTimeZones > 0) {
      htmlTimeZones = `<h3>🌐 По прилёту в указанную страну нужно будет перевести время на <span class="blue-coloured">${differenceTimeZones} ч. назад</span>.</h3>`;
    } else if (differenceTimeZones < 0) {
      const realDifference = String(differenceTimeZones).slice(1);
      htmlTimeZones = `<h3>🌐 По прилёту в указанную страну нужно будет перевести время на <span class="blue-coloured">${realDifference} ч. вперёд</span>.</h3>`;
    }
    if (countryDestination.value === "UA" || countryOrigin.value === "UA") {
      htmlTimeZonesUkraine =
        '<h3 style="padding-left: 7px">❗ Имейте в виду, что при подсчёте разницы во времени учитывается <span class="red-coloured">украинское зимнее время.</span> Летнее время - на час вперёд от зимнего.</h3>';
    }
    placeholderAfterSelectors.insertAdjacentHTML("beforeend", htmlTimeZones);
    placeholderAfterSelectors.insertAdjacentHTML(
      "beforeend",
      htmlTimeZonesUkraine
    );

    //Объяснить, что сейчас будет карта
    const htmlThisIsMap = `<h4>🗺️ Ниже вы сможете ознакомиться с маршрутом путешествия на карте мира. Расстояние между странами составляет приблизительно ${Math.round(
      distanceBetweenCoords
    )} км.</h4>
    <style> 
      .map-alert {
        margin-top: 15px;
      }
    </style>`;
    mapAlert.insertAdjacentHTML("beforeend", htmlThisIsMap);
  })();

  //////АВИАБИЛЕТЫ////////////////////////////////

  //Создать input
  flightsPrices.classList.remove("hidden");
  // const htmlInputFields = ``;
  // flightsPrices.insertAdjacentHTML("beforeend", htmlInputFields);

  //Поместить данные из input в переменные
  btnReadyFlights.addEventListener("click", function (e) {
    e.preventDefault();

    const inputDepartureDate = document.getElementById("departure-date");
    const inputReturnDate = document.getElementById("return-date");
    const inputCurrency = document.getElementById("currency-tickets");
    ticketsOutput.innerHTML = "";
    //Показать цену за непрямые и прямые рейсы
    //1-2 - ПРЯМЫЕ, 3-4 - НЕПРЯМЫЕ РЕЙСЫ
    let priceFlights = ["237", "291", "128", "147"];
    let cityOrigins = ["City1", "City2", "City3", "City4"];
    let cityDestinations = ["City5", "City6", "City7", "City8"];
    let carriersFrom = ["Wizz Air", "Ryanair", "Ryanair", "Lufthansa"];
    let carriersTo = ["Ryanair", "Wizz Air", "Wizz Air", "Ryanair"];
    
    ticketsOutput.classList.remove("hidden");
    const htmlTickets = `<h3 class="congrats">😀 Мы нашли для вас следующие варианты перелётов:</h3>
    <table>
      <tr>
        <th style="width=170px">Прямой перелёт/с пересадкой</th>
        <th style="width=170px">Цена в ${
          inputCurrency.value
        } в обе стороны</th>
        <th>Город отправления</th>
        <th>Город прибытия</th>
        <th style="width=170px">Авиакомпания (перелёт "туда")</th>
        <th style="width=170px">Авиакомпания (перелёт "обратно")</th>
      </tr>
      <tr>
        <td style="text-align: center;" rowspan="2"><img src="images/directflight.jpg" alt="Прямой" width="150px" /></td>
        <td><b>${
          priceFlights[0] ? priceFlights[0] : "Нет прямых рейсов"
        }</b></td>
        <td>${priceFlights[0] ? cityOrigins[0] : "-"}</td>
        <td>${priceFlights[0] ? cityDestinations[0] : "-"}</td>
        <td>${priceFlights[0] ? carriersFrom[0] : "-"}</td>
        <td>${priceFlights[0] ? carriersTo[0] : "-"}</td>
      </tr>
      <tr>
        <td><b>${priceFlights[1] ? priceFlights[1] : "-"}</b></td>
        <td>${priceFlights[1] ? cityOrigins[1] : "-"}</td>
        <td>${priceFlights[1] ? cityDestinations[1] : "-"}</td>
        <td>${priceFlights[1] ? carriersFrom[1] : "-"}</td>
        <td>${priceFlights[1] ? carriersTo[1] : "-"}</td>
      </tr>
      <tr>
        <td rowspan="2" style="text-align: center;"><img src="images/connectingflight.jpg" alt="С пересадкой" width="150px" /></td>
        <td><b>${
          priceFlights[2] ? priceFlights[2] : "Нет рейсов с пересадкой"
        }</b></td>
        <td>${priceFlights[2] ? cityOrigins[2] : "-"}</td>
        <td>${priceFlights[2] ? cityDestinations[2] : "-"}</td>
        <td>${priceFlights[2] ? carriersFrom[2] : "-"}</td>
        <td>${priceFlights[2] ? carriersTo[2] : "-"}</td>
      </tr>
      <tr>
        <td><b>${priceFlights[3] ? priceFlights[3] : "-"}</b></td>
        <td>${priceFlights[3] ? cityOrigins[3] : "-"}</td>
        <td>${priceFlights[3] ? cityDestinations[3] : "-"}</td>
        <td>${priceFlights[3] ? carriersFrom[3] : "-"}</td>
        <td>${priceFlights[3] ? carriersTo[3] : "-"}</td>
      </tr>
      </table>
      <div class="warning"><h5>К сожалению, Skyscanner API был отключён в конце 2021 года, поэтому настоящие цены временно недоступны. Для реальных результатов рекомендуем воспользоваться веб-сайтом skyscanner.com.ua/</h5></div>`;
    ticketsOutput.insertAdjacentHTML("beforeend", htmlTickets);
    flightsPrices.scrollIntoView({ behavior: "smooth" });

    /*fetch(
      `https://skyscanner-skyscanner-flight-search-v1.p.rapidapi.com/apiservices/browseroutes/v1.0/UA/${inputCurrency.value}/en-GB/${countryOrigin.value}/${countryDestination.value}/${inputDepartureDate.value}/${inputReturnDate.value}`,
      {
        method: "GET",
        headers: {
          "x-rapidapi-key":
            "49af5718bfmshbe2e8d52f4de10ep157160jsn44623415c926",
          "x-rapidapi-host":
            "skyscanner-skyscanner-flight-search-v1.p.rapidapi.com",
        },
      }
    )
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        console.log(data);
        if (data["Quotes"]["length"] === 0) {
          const htmlNoTickets =
            "<h3>😥 Билетов на выбранные даты не найдено. Попробуйте изменить даты!</h3>";
          ticketsOutput.insertAdjacentHTML("afterbegin", htmlNoTickets);
          flightsPrices.scrollIntoView({ behavior: "smooth" });
        } else {
          for (let i = 0; i < data["Quotes"].length; i++) {
            if (data["Quotes"][i]["Direct"] === true && !priceFlights[0]) {
              priceFlights[0] = data["Quotes"][i]["MinPrice"];
              cityOrigins[0] = data["Quotes"][i]["OutboundLeg"]["OriginId"];
              cityDestinations[0] =
                data["Quotes"][i]["OutboundLeg"]["DestinationId"];
              carriersFrom[0] =
                data["Quotes"][i]["OutboundLeg"]["CarrierIds"][0];
              carriersTo[0] = data["Quotes"][i]["InboundLeg"]["CarrierIds"][0];
              //Turning codes into real data
              const objectCityOrigin = data["Places"].find(
                (element) => element["PlaceId"] === cityOrigins[0]
              );
              cityOrigins[0] = objectCityOrigin["CityName"];
              const objectCityDestination = data["Places"].find(
                (element) => element["PlaceId"] === cityDestinations[0]
              );
              cityDestinations[0] = objectCityDestination["CityName"];
              const objectCarrier = data["Carriers"].find(
                (element) => element["CarrierId"] === carriersFrom[0]
              );
              carriersFrom[0] = objectCarrier["Name"];
              const objectCarrier2 = data["Carriers"].find(
                (element) => element["CarrierId"] === carriersTo[0]
              );
              carriersTo[0] = objectCarrier2["Name"];
            } else if (
              data["Quotes"][i]["Direct"] === true &&
              priceFlights[0] &&
              !priceFlights[1]
            ) {
              priceFlights[1] = data["Quotes"][i]["MinPrice"];
              cityOrigins[1] = data["Quotes"][i]["OutboundLeg"]["OriginId"];
              cityDestinations[1] =
                data["Quotes"][i]["OutboundLeg"]["DestinationId"];
              carriersFrom[1] =
                data["Quotes"][i]["OutboundLeg"]["CarrierIds"][0];
              carriersTo[1] = data["Quotes"][i]["InboundLeg"]["CarrierIds"][0];
              //Turning codes into real data
              const objectCityOrigin = data["Places"].find(
                (element) => element["PlaceId"] === cityOrigins[1]
              );
              cityOrigins[1] = objectCityOrigin["CityName"];
              const objectCityDestination = data["Places"].find(
                (element) => element["PlaceId"] === cityDestinations[1]
              );
              cityDestinations[1] = objectCityDestination["CityName"];
              const objectCarrier = data["Carriers"].find(
                (element) => element["CarrierId"] === carriersFrom[1]
              );
              carriersFrom[1] = objectCarrier["Name"];
              const objectCarrier2 = data["Carriers"].find(
                (element) => element["CarrierId"] === carriersTo[1]
              );
              carriersTo[1] = objectCarrier2["Name"];
            } else if (
              data["Quotes"][i]["Direct"] === false &&
              !priceFlights[2]
            ) {
              priceFlights[2] = data["Quotes"][i]["MinPrice"];
              cityOrigins[2] = data["Quotes"][i]["OutboundLeg"]["OriginId"];
              cityDestinations[2] =
                data["Quotes"][i]["OutboundLeg"]["DestinationId"];
              carriersFrom[2] =
                data["Quotes"][i]["OutboundLeg"]["CarrierIds"][0];
              carriersTo[2] = data["Quotes"][i]["InboundLeg"]["CarrierIds"][0];
              //Turning codes into real data
              const objectCityOrigin = data["Places"].find(
                (element) => element["PlaceId"] === cityOrigins[2]
              );
              cityOrigins[2] = objectCityOrigin["CityName"];
              const objectCityDestination = data["Places"].find(
                (element) => element["PlaceId"] === cityDestinations[2]
              );
              cityDestinations[2] = objectCityDestination["CityName"];
              const objectCarrier = data["Carriers"].find(
                (element) => element["CarrierId"] === carriersFrom[2]
              );
              carriersFrom[2] = objectCarrier["Name"];
              const objectCarrier2 = data["Carriers"].find(
                (element) => element["CarrierId"] === carriersTo[2]
              );
              carriersTo[2] = objectCarrier2["Name"];
            } else if (
              data["Quotes"][i]["Direct"] === false &&
              priceFlights[2] &&
              !priceFlights[3]
            ) {
              priceFlights[3] = data["Quotes"][i]["MinPrice"];
              cityOrigins[3] = data["Quotes"][i]["OutboundLeg"]["OriginId"];
              cityDestinations[3] =
                data["Quotes"][i]["OutboundLeg"]["DestinationId"];
              carriersFrom[3] =
                data["Quotes"][i]["OutboundLeg"]["CarrierIds"][0];
              carriersTo[3] = data["Quotes"][i]["InboundLeg"]["CarrierIds"][0];
              //Turning codes into real data
              const objectCityOrigin = data["Places"].find(
                (element) => element["PlaceId"] === cityOrigins[3]
              );
              cityOrigins[3] = objectCityOrigin["CityName"];
              const objectCityDestination = data["Places"].find(
                (element) => element["PlaceId"] === cityDestinations[3]
              );
              cityDestinations[3] = objectCityDestination["CityName"];
              const objectCarrier = data["Carriers"].find(
                (element) => element["CarrierId"] === carriersFrom[3]
              );
              carriersFrom[3] = objectCarrier["Name"];
              const objectCarrier2 = data["Carriers"].find(
                (element) => element["CarrierId"] === carriersTo[3]
              );
              carriersTo[3] = objectCarrier2["Name"];
            }
          }
          console.log(
            priceFlights,
            cityDestinations,
            cityOrigins,
            carriersFrom,
            carriersTo
          );
          const htmlTickets = `<style>
          .tickets-output {
            border-top: #97b6be 1px solid;
            background-color: #eaffff;
            padding: 25px 50px;
          }
          </style>
          <h3 class="congrats">😀 Мы нашли для вас следующие варианты перелётов:</h3>
          <table>
            <tr>
              <th style="width=170px">Прямой перелёт/с пересадкой</th>
              <th style="width=170px">Цена в ${
                inputCurrency.value
              } в обе стороны</th>
              <th>Город отправления</th>
              <th>Город прибытия</th>
              <th style="width=170px">Авиакомпания (перелёт "туда")</th>
              <th style="width=170px">Авиакомпания (перелёт "обратно")</th>
            </tr>
            <tr>
              <td style="text-align: center;" rowspan="2"><img src="images/directflight.jpg" alt="Прямой" width="150px" /></td>
              <td><b>${
                priceFlights[0] ? priceFlights[0] : "Нет прямых рейсов"
              }</b></td>
              <td>${priceFlights[0] ? cityOrigins[0] : "-"}</td>
              <td>${priceFlights[0] ? cityDestinations[0] : "-"}</td>
              <td>${priceFlights[0] ? carriersFrom[0] : "-"}</td>
              <td>${priceFlights[0] ? carriersTo[0] : "-"}</td>
            </tr>
            <tr>
              <td><b>${priceFlights[1] ? priceFlights[1] : "-"}</b></td>
              <td>${priceFlights[1] ? cityOrigins[1] : "-"}</td>
              <td>${priceFlights[1] ? cityDestinations[1] : "-"}</td>
              <td>${priceFlights[1] ? carriersFrom[1] : "-"}</td>
              <td>${priceFlights[1] ? carriersTo[1] : "-"}</td>
            </tr>
            <tr>
              <td rowspan="2" style="text-align: center;"><img src="images/connectingflight.jpg" alt="С пересадкой" width="150px" /></td>
              <td><b>${
                priceFlights[2] ? priceFlights[2] : "Нет рейсов с пересадкой"
              }</b></td>
              <td>${priceFlights[2] ? cityOrigins[2] : "-"}</td>
              <td>${priceFlights[2] ? cityDestinations[2] : "-"}</td>
              <td>${priceFlights[2] ? carriersFrom[2] : "-"}</td>
              <td>${priceFlights[2] ? carriersTo[2] : "-"}</td>
            </tr>
            <tr>
              <td><b>${priceFlights[3] ? priceFlights[3] : "-"}</b></td>
              <td>${priceFlights[3] ? cityOrigins[3] : "-"}</td>
              <td>${priceFlights[3] ? cityDestinations[3] : "-"}</td>
              <td>${priceFlights[3] ? carriersFrom[3] : "-"}</td>
              <td>${priceFlights[3] ? carriersTo[3] : "-"}</td>
            </tr>
            </table>
            <div class="warning"><h5>Поиск билетов пока что выпущен в бета-версии, поэтому некоторые варианты могут не отображаться. Для точных результатов рекомендуем воспользоваться веб-сайтом aviasales.ua.</h5></div>`;
          ticketsOutput.insertAdjacentHTML("beforeend", htmlTickets);
          flightsPrices.scrollIntoView({ behavior: "smooth" });
        }
      })
      .catch((err) => {
        console.error(err);
      });*/
      
  });

});
