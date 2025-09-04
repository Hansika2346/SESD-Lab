/* Factory Method demo: product creation for an E-commerce app */

/* ---------------- Product classes ---------------- */
class Product {
  constructor({ name, price }) {
    this.name = name;
    this.price = parseFloat(price) || 0;
    this.id = `p_${Date.now()}_${Math.floor(Math.random()*1000)}`;
  }
  describe() {
    return `${this.name} — ₹${this.price.toFixed(2)}`;
  }
  meta() {
    return {};
  }
}

class ElectronicsProduct extends Product {
  constructor({ name, price, brand, warrantyYears }) {
    super({ name, price });
    this.brand = brand || 'Unknown';
    this.warrantyYears = warrantyYears || 1;
  }
  describe() {
    return `${this.name} (${this.brand}) — ₹${this.price.toFixed(2)} — ${this.warrantyYears}yr warranty`;
  }
  meta() { return { brand: this.brand, warrantyYears: this.warrantyYears }; }
}

class ClothingProduct extends Product {
  constructor({ name, price, size, material }) {
    super({ name, price });
    this.size = size || 'M';
    this.material = material || 'Unknown';
  }
  describe() {
    return `${this.name} — Size: ${this.size} — ${this.material} — ₹${this.price.toFixed(2)}`;
  }
  meta() { return { size: this.size, material: this.material }; }
}

class BookProduct extends Product {
  constructor({ name, price, author, pages }) {
    super({ name, price });
    this.author = author || 'Unknown';
    this.pages = pages || 0;
  }
  describe() {
    return `"${this.name}" by ${this.author} — ${this.pages} pages — ₹${this.price.toFixed(2)}`;
  }
  meta() { return { author: this.author, pages: this.pages }; }
}

/* ---------------- Creator (Factory Method) ---------------- */
/*
  The Creator defines the factory method. Concrete creators override factoryMethod()
  to return different Product subtypes.
*/
class ProductCreator {
  create(data) {
    // common pre/post logic could go here
    return this.factoryMethod(data);
  }
  factoryMethod(/* data */) {
    throw new Error('factoryMethod() must be implemented by subclasses');
  }
}

class ElectronicsCreator extends ProductCreator {
  factoryMethod(data) {
    return new ElectronicsProduct(data);
  }
}
class ClothingCreator extends ProductCreator {
  factoryMethod(data) {
    return new ClothingProduct(data);
  }
}
class BookCreator extends ProductCreator {
  factoryMethod(data) {
    return new BookProduct(data);
  }
}

/* ---------------- Registry to centralize creation ---------------- */
const ProductFactory = (function(){
  const registry = new Map();

  // register built-in creators
  registry.set('electronics', new ElectronicsCreator());
  registry.set('clothing', new ClothingCreator());
  registry.set('book', new BookCreator());

  return {
    create: (type, data) => {
      const creator = registry.get(type);
      if (!creator) throw new Error(`No creator registered for type "${type}"`);
      return creator.create(data);
    },
    register: (type, creatorInstance) => {
      registry.set(type, creatorInstance);
    },
    unregister: (type) => {
      registry.delete(type);
    },
    availableTypes: () => Array.from(registry.keys())
  };
})();

/* ---------------- UI wiring ---------------- */
(function(){
  const productType = document.getElementById('productType');
  const typeFields = document.getElementById('typeFields');
  const nameInput = document.getElementById('name');
  const priceInput = document.getElementById('price');
  const createBtn = document.getElementById('createBtn');
  const productList = document.getElementById('productList');
  const clearBtn = document.getElementById('clearBtn');

  const created = [];

  function renderTypeFields(type) {
    // wipe
    typeFields.innerHTML = '';
    if (type === 'electronics') {
      typeFields.innerHTML = `
        <label>Brand <input id="brand" placeholder="Brand name"></label>
        <label>Warranty (years) <input id="warranty" type="number" min="0" placeholder="1"></label>
      `;
    } else if (type === 'clothing') {
      typeFields.innerHTML = `
        <label>Size
          <select id="size">
            <option>S</option><option>M</option><option>L</option><option>XL</option>
          </select>
        </label>
        <label>Material <input id="material" placeholder="Cotton"></label>
      `;
    } else if (type === 'book') {
      typeFields.innerHTML = `
        <label>Author <input id="author" placeholder="Author"></label>
        <label>Pages <input id="pages" type="number" placeholder="200"></label>
      `;
    }
  }

  function addProductToUI(prod) {
    const li = document.createElement('li');
    li.dataset.id = prod.id;
    li.innerHTML = `<div>${prod.describe()}</div><div><button class="clone">Clone</button> <button class="remove">Remove</button></div>`;
    productList.appendChild(li);

    li.querySelector('.remove').addEventListener('click', () => {
      const idx = created.findIndex(p => p.id === prod.id);
      if (idx >= 0) { created.splice(idx,1); li.remove(); }
    });

    li.querySelector('.clone').addEventListener('click', () => {
      // cloning by using the same creation flow (simulate prototype by re-creating)
      const cloneData = Object.assign({}, prod.meta ? prod.meta() : {}, { name: prod.name + ' (clone)', price: prod.price });
      const type = (() => {
        if (prod instanceof ElectronicsProduct) return 'electronics';
        if (prod instanceof ClothingProduct) return 'clothing';
        if (prod instanceof BookProduct) return 'book';
        return null;
      })();
      if (!type) return;
      const newProd = ProductFactory.create(type, cloneData);
      created.push(newProd);
      addProductToUI(newProd);
    });
  }

  createBtn.addEventListener('click', () => {
    const type = productType.value;
    const name = nameInput.value.trim() || 'Untitled';
    const price = parseFloat(priceInput.value) || 0;

    const base = { name, price };

    // collect type specific fields
    let data = Object.assign({}, base);
    if (type === 'electronics') {
      data.brand = (document.getElementById('brand') || {}).value || 'Generic';
      data.warrantyYears = parseInt((document.getElementById('warranty') || {}).value || 1, 10);
    } else if (type === 'clothing') {
      data.size = (document.getElementById('size') || {}).value || 'M';
      data.material = (document.getElementById('material') || {}).value || 'Unknown';
    } else if (type === 'book') {
      data.author = (document.getElementById('author') || {}).value || 'Unknown';
      data.pages = parseInt((document.getElementById('pages') || {}).value || 0, 10);
    }

    try {
      const product = ProductFactory.create(type, data);
      created.push(product);
      addProductToUI(product);
      // reset lightweight fields
      nameInput.value = '';
      priceInput.value = '';
    } catch (err) {
      alert(err.message);
    }
  });

  clearBtn.addEventListener('click', () => {
    created.length = 0;
    productList.innerHTML = '';
  });

  // initialize fields for default selection
  renderTypeFields(productType.value);
  productType.addEventListener('change', (e) => renderTypeFields(e.target.value));
})();
