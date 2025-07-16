
const apiKey = "8bea15c4fa9b2219d2e92602a4e81c21"; // Sua chave API aqui
let chart; // Variável global para o gráfico

// Função para remover acentos
function removerAcentos(texto) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Função para buscar o clima atual e atualizar a interface
function buscarClima() {
  const cidadeRaw = document.getElementById("cityInput").value.trim();
  const cidade = removerAcentos(cidadeRaw);
  const weatherResult = document.getElementById("weatherResult");
  const errorMessage = document.getElementById("errorMessage");

  if (!cidade) {
    errorMessage.textContent = "Digite o nome de uma cidade.";
    errorMessage.classList.remove("hidden");
    weatherResult.classList.add("hidden");
    return;
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?q=${cidade}&appid=${apiKey}&units=metric&lang=pt_br`;

  fetch(url)
    .then(res => {
      if (!res.ok) throw new Error("Cidade não encontrada");
      return res.json();
    })
    .then(data => {
      errorMessage.classList.add("hidden");
      preencherClima(data);
      buscarPrevisao(cidade);
    })
    .catch(() => {
      weatherResult.classList.add("hidden");
      errorMessage.textContent = "Cidade não encontrada. Tente novamente.";
      errorMessage.classList.remove("hidden");
    });
}

// Função que atualiza o DOM com dados do clima atual
function preencherClima(data) {
  const weatherResult = document.getElementById("weatherResult");
  weatherResult.classList.remove("hidden");

  document.getElementById("cityName").textContent = `${data.name}, ${data.sys.country}`;
  document.getElementById("weatherIcon").src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
  document.getElementById("temperature").textContent = `${Math.round(data.main.temp)}°C`;
  document.getElementById("description").textContent = data.weather[0].description;
  document.getElementById("humidity").textContent = `Umidade: ${data.main.humidity}%`;
  document.getElementById("wind").textContent = `Vento: ${data.wind.speed} km/h`;
}

// Função para buscar previsão de 5 dias e gerar gráfico
function buscarPrevisao(cidade) {
  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${cidade}&appid=${apiKey}&units=metric&lang=pt_br`;

  fetch(url)
    .then(res => res.json())
    .then(data => {
      const dias = {};
      data.list.forEach(item => {
        const [dia, hora] = item.dt_txt.split(" ");

        if (hora === "12:00:00") {
          dias[dia] = {
            temp: item.main.temp,
            desc: item.weather[0].description
          };
        }
      });

      const labels = Object.keys(dias).map(d => {
        const date = new Date(d);
        return date.toLocaleDateString("pt-BR", { weekday: 'short', day: 'numeric' });
      });

      const temperaturas = Object.values(dias).map(d => d.temp);

      gerarGrafico(labels, temperaturas);
    })
    .catch(() => {
      console.log("Erro ao obter previsão.");
    });
}

// Função para gerar o gráfico com Chart.js
function gerarGrafico(labels, data) {
  const ctx = document.getElementById("forecastChart").getContext("2d");

  if (chart) chart.destroy(); // Destrói gráfico anterior se existir

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: "Temp (°C)",
        data: data,
        fill: true,
        borderColor: "#38bdf8",
        backgroundColor: "rgba(56, 189, 248, 0.2)",
        tension: 0.3,
        pointBackgroundColor: "white",
        pointBorderColor: "#38bdf8"
      }]
    },
    options: {
      plugins: {
        legend: {
          labels: { color: "white" }
        }
      },
      scales: {
        x: { ticks: { color: "white" } },
        y: { ticks: { color: "white" } }
      }
    }
  });
}

// Geolocalização automática para buscar clima na abertura da página
window.onload = () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(position => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=pt_br`;

      fetch(url)
        .then(res => res.json())
        .then(data => {
          preencherClima(data);
          buscarPrevisao(data.name);
        })
        .catch(() => {
          console.log("Erro ao obter clima por geolocalização");
        });
    });
  }
  function buscarSugestoes(nomeParcial) {
  if (nomeParcial.length < 3) {
    document.getElementById("suggestions").classList.add("hidden");
    return;
  }

  const url = `https://api.openweathermap.org/geo/1.0/direct?q=${nomeParcial}&limit=5&appid=${apiKey}`;

  fetch(url)
    .then(res => res.json())
    .then(dados => {
      const lista = document.getElementById("suggestions");
      lista.innerHTML = "";

      if (dados.length === 0) {
        lista.classList.add("hidden");
        return;
      }

      dados.forEach(cidade => {
        const item = document.createElement("li");
        item.className = "p-2 hover:bg-blue-100 cursor-pointer";
        item.textContent = `${cidade.name}, ${cidade.state || ""}, ${cidade.country}`;
        item.onclick = () => {
          document.getElementById("cityInput").value = cidade.name;
          lista.classList.add("hidden");
        };
        lista.appendChild(item);
      });

      lista.classList.remove("hidden");
    })
    .catch(() => {
      console.log("Erro ao buscar sugestões");
    });
}

};
