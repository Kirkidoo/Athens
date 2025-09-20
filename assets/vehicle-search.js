class VehicleSearch extends HTMLElement {
  constructor() {
    super();

    this.sectionId = this.dataset.sectionId;
    this.apiUrl = this.dataset.apiUrl;
    this.token = this.dataset.apiToken;

    this.typeSelect = this.querySelector(`#vehicle-search-type-${this.sectionId}`);
    this.yearSelect = this.querySelector(`#vehicle-search-year-${this.sectionId}`);
    this.makeSelect = this.querySelector(`#vehicle-search-make-${this.sectionId}`);
    this.modelSelect = this.querySelector(`#vehicle-search-model-${this.sectionId}`);
    this.submitButton = this.querySelector(`#vehicle-search-submit-${this.sectionId}`);

    this.typeSelect.addEventListener("change", this.onTypeChange.bind(this));
    this.yearSelect.addEventListener("change", this.onYearChange.bind(this));
    this.makeSelect.addEventListener("change", this.onMakeChange.bind(this));
    this.modelSelect.addEventListener("change", this.onModelChange.bind(this));
    this.submitButton.addEventListener("click", this.onSubmit.bind(this));
  }

  connectedCallback() {
    this.fetchTypes();
  }

  fetchTypes() {
    fetch(`${this.apiUrl}/fitment/getTypeOptions`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        this.populateDropdown(this.typeSelect, data.data.types);
      })
      .catch((error) => console.error("Error fetching types:", error));
  }

  onTypeChange() {
    const type = this.typeSelect.value;
    this.yearSelect.disabled = true;
    this.makeSelect.disabled = true;
    this.modelSelect.disabled = true;
    this.submitButton.disabled = true;

    if (type) {
      this.fetchYears(type);
      this.fetchMakes(type);
    }
  }

  fetchYears(type) {
    fetch(`${this.apiUrl}/fitment/getYearOptions?type=${type}`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        this.populateDropdown(this.yearSelect, data.data.years.sort().reverse());
        this.yearSelect.disabled = false;
      })
      .catch((error) => console.error("Error fetching years:", error));
  }

  fetchMakes(type) {
    fetch(`${this.apiUrl}/fitment/getMakeOptions?type=${type}`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        this.populateDropdown(this.makeSelect, data.data.makes.sort());
        this.makeSelect.disabled = false;
      })
      .catch((error) => console.error("Error fetching makes:", error));
  }

  onYearChange() {
    const type = this.typeSelect.value;
    const year = this.yearSelect.value;
    const make = this.makeSelect.value;
    this.modelSelect.disabled = true;
    this.submitButton.disabled = true;

    if (type && year && make) {
      this.fetchModels(type, year, make);
    }
  }

  onMakeChange() {
    const type = this.typeSelect.value;
    const year = this.yearSelect.value;
    const make = this.makeSelect.value;
    this.modelSelect.disabled = true;
    this.submitButton.disabled = true;

    if (type && year && make) {
      this.fetchModels(type, year, make);
    }
  }

  fetchModels(type, year, make) {
    fetch(
      `${this.apiUrl}/fitment/getModelOptions?type=${type}&year=${year}&make=${make}`,
      {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      }
    )
      .then((response) => response.json())
      .then((data) => {
        this.populateDropdown(this.modelSelect, data.data.models.sort());
        this.modelSelect.disabled = false;
      })
      .catch((error) => console.error("Error fetching models:", error));
  }

  onModelChange() {
    this.submitButton.disabled = !this.modelSelect.value;
  }

  onSubmit() {
    const make = this.makeSelect.value;
    const year = this.yearSelect.value;
    const model = this.modelSelect.value;

    if (!make || !year || !model) {
      return;
    }

    this.submitButton.disabled = true;
    this.submitButton.textContent = "Finding...";

    fetch(
      `${this.apiUrl}/fitment/getFitmentProducts?make=${make}&year=${year}&model=${model}`,
      {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      }
    )
      .then((response) => response.json())
      .then((data) => {
        const vehicle = {
          type: this.typeSelect.value,
          year: this.yearSelect.value,
          make: this.makeSelect.value,
          model: this.modelSelect.value,
        };
        sessionStorage.setItem("vehicleSearch", JSON.stringify(vehicle));
        sessionStorage.setItem("fitmentProducts", JSON.stringify(data.data.fitmentProducts));

        const itemNumbers = data.data.fitmentProducts.map(
          (product) => product.itemNumber
        );
        const query = itemNumbers.join(" OR ");
        window.location.href = `/search?q=${query}&options[prefix]=last`;
      })
      .catch((error) => {
        console.error("Error fetching products:", error);
        this.submitButton.disabled = false;
        this.submitButton.textContent = "Find Parts";
      });
  }

  populateDropdown(selectElement, options) {
    selectElement.innerHTML = `<option value="">Select ${
      selectElement.name.charAt(0).toUpperCase() + selectElement.name.slice(1)
    }</option>`;
    options.forEach((option) => {
      const optionElement = document.createElement("option");
      optionElement.value = option;
      optionElement.textContent = option;
      selectElement.appendChild(optionElement);
    });
  }
}

customElements.define("vehicle-search", VehicleSearch);
