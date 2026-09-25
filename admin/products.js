const API_URL = '/api/admin/products';

let products = [];

async function loadProducts() {
    const table = document.getElementById('productsTable');

    try {
        const response = await adminFetch(API_URL);
        if (!response.ok) throw new Error('API request failed');

        const data = await response.json();
        if (!data.success) throw new Error(data.error || 'Could not load products');

        products = data.products.map(p => ({
            ...p,
            images: safeParse(p.images, []),
            variants: safeParse(p.variants, []),
            related_slugs: safeParse(p.related_slugs, [])
        }));

        if (!products.length) {
            table.innerHTML = `<tr><td colspan="6">No products yet.</td></tr>`;
            return;
        }

        table.innerHTML = products.map(p => `
            <tr data-slug="${escapeHTML(p.slug)}">
                <td>${escapeHTML(p.name)}</td>
                <td>${escapeHTML(p.slug)}</td>
                <td>${escapeHTML(p.sku || '')}</td>
                <td>${escapeHTML(p.badge || '')}</td>
                <td>${escapeHTML(p.category || '')}</td>
                <td>
                    <button class="edit-btn" data-slug="${escapeHTML(p.slug)}">Edit</button>
                    <button class="delete-btn" data-slug="${escapeHTML(p.slug)}">Delete</button>
                </td>
            </tr>
        `).join('');

        document.querySelectorAll('.edit-btn').forEach(b =>
            b.addEventListener('click', () => openForm(b.dataset.slug)));
        document.querySelectorAll('.delete-btn').forEach(b =>
            b.addEventListener('click', () => deleteProduct(b.dataset.slug)));

    } catch (error) {
        console.error(error);
        table.innerHTML = `<tr><td colspan="6">Could not connect to backend.</td></tr>`;
    }
}

function openForm(slug) {
    const product = slug ? products.find(p => p.slug === slug) : null;
    const panel = document.getElementById('productForm');
    const isEdit = !!product;

    const relatedOptions = products
        .filter(p => !product || p.slug !== product.slug)
        .map(p => {
            const checked = product && product.related_slugs.includes(p.slug) ? 'checked' : '';
            return `<label class="related-check">
                <input type="checkbox" name="related_slugs" value="${escapeHTML(p.slug)}" ${checked}>
                ${escapeHTML(p.name)}
            </label>`;
        }).join('');

    panel.innerHTML = `
        <div class="panel-header">
            <p class="eyebrow">${isEdit ? 'EDIT' : 'NEW'} PRODUCT</p>
            <h2>${isEdit ? 'Edit' : 'Add'} Product</h2>
        </div>
        <form id="pForm">
            <label>Slug ${isEdit ? '(locked)' : ''}
                <input name="slug" value="${escapeHTML(product?.slug || '')}" ${isEdit ? 'readonly' : ''} required>
            </label>
            <label>Name
                <input name="name" value="${escapeHTML(product?.name || '')}" required>
            </label>
            <label>Description
                <textarea name="description">${escapeHTML(product?.description || '')}</textarea>
            </label>
            <label>Category
                <input name="category" value="${escapeHTML(product?.category || '')}">
            </label>
            <label>SKU
                <input name="sku" value="${escapeHTML(product?.sku || '')}">
            </label>
            <label>Badge
                <input name="badge" value="${escapeHTML(product?.badge || '')}">
            </label>
            <label>Eyebrow
                <input name="eyebrow" value="${escapeHTML(product?.eyebrow || '')}">
            </label>
            <label>Meta Keywords
                <input name="meta_keywords" value="${escapeHTML(product?.meta_keywords || '')}">
            </label>
            <label>Images (comma-separated paths — push images to /images via git first, e.g. /images/ragnarok-card.jpg, /images/ragnarok-hero.jpg)
                <textarea name="images">${escapeHTML((product?.images || []).join(', '))}</textarea>
            </label>
            <label>Variants (one per line: name|price)
                <textarea name="variants">${(product?.variants || []).map(v => `${v.name}|${v.price}`).join('\n')}</textarea>
            </label>
            <fieldset>
                <legend>Related Products</legend>
                ${relatedOptions}
            </fieldset>
            <div class="form-actions">
                <button type="submit">${isEdit ? 'Save Changes' : 'Create Product'}</button>
                <button type="button" id="cancelForm">Cancel</button>
            </div>
        </form>
    `;

    panel.classList.remove('hidden');
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });

    document.getElementById('cancelForm').addEventListener('click', () => panel.classList.add('hidden'));
    document.getElementById('pForm').addEventListener('submit', (e) => submitForm(e, isEdit, slug));
}

async function submitForm(e, isEdit, slug) {
    e.preventDefault();
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;

    const images = form.images.value.split(',').map(s => s.trim()).filter(Boolean);
    const variants = form.variants.value.split('\n').map(s => s.trim()).filter(Boolean).map(line => {
        const [name, price] = line.split('|').map(s => s.trim());
        return { name, price: Number(price) || 0 };
    });
    const related_slugs = Array.from(form.querySelectorAll('input[name="related_slugs"]:checked')).map(cb => cb.value);

    const payload = {
        slug: form.slug.value.trim(),
        name: form.name.value.trim(),
        description: form.description.value,
        category: form.category.value,
        sku: form.sku.value,
        badge: form.badge.value,
        eyebrow: form.eyebrow.value,
        meta_keywords: form.meta_keywords.value,
        images,
        variants,
        related_slugs
    };

    try {
        const url = isEdit ? `${API_URL}/${encodeURIComponent(slug)}` : API_URL;
        const method = isEdit ? 'PUT' : 'POST';
        const r = await adminFetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const d = await r.json();
        if (!r.ok || !d.success) throw new Error(d.error || 'Save failed');

        document.getElementById('productForm').classList.add('hidden');
        await loadProducts();
    } catch (err) {
        alert(err.message);
        submitBtn.disabled = false;
    }
}

async function deleteProduct(slug) {
    if (!confirm(`Delete "${slug}"? This cannot be undone.`)) return;
    try {
        const r = await adminFetch(`${API_URL}/${encodeURIComponent(slug)}`, { method: 'DELETE' });
        const d = await r.json();
        if (!r.ok || !d.success) throw new Error(d.error || 'Delete failed');
        await loadProducts();
    } catch (err) {
        alert(err.message);
    }
}

function safeParse(value, fallback) {
    if (Array.isArray(value) || (value && typeof value === 'object')) return value;
    try { return JSON.parse(value); } catch (e) { return fallback; }
}

function escapeHTML(value) {
    const div = document.createElement('div');
    div.textContent = value ?? '';
    return div.innerHTML;
}

document.getElementById('addProductBtn').addEventListener('click', () => openForm(null));

loadProducts();
