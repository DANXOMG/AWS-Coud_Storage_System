document.getElementById('uploadForm').addEventListener('submit', async function(e) {
    e.preventDefault();
   
    const formData = new FormData();
    const file = document.getElementById('file').files[0];
    const cliente = document.getElementById('cliente').value.trim();
   
    if (!file || !cliente) {
        alert('Completa todos los campos');
        return;
    }
    formData.append('file', file);
    formData.append('cliente', cliente);
    const btn = document.getElementById('uploadBtn');
    const resultDiv = document.getElementById('result');
   
    btn.classList.add('loading');
    resultDiv.classList.add('hidden');
    try {
        const res = await fetch('/upload', {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        if (data.success) {
            resultDiv.innerHTML = `
                <h3>Archivo Subido y Analizado</h3>
                <p><strong>Sesión:</strong> <code>${data.session_id}</code></p>
                <p><strong>Tamaño:</strong> ${data.resultado.tamaño_kb} KB</p>
                <p><strong>Tipo:</strong> ${data.resultado.tipo}</p>
                <h4>Vista previa:</h4>
                <pre>${data.resultado.vista_previa}</pre>
            `;
            resultDiv.classList.remove('hidden');
            document.getElementById('uploadForm').reset();
            setTimeout(() => location.reload(), 1500); // Refresca historial
        } else {
            alert('Error: ' + (data.error || 'Desconocido'));
        }
    } catch (err) {
        alert('Error de conexión');
        console.error(err);
    } finally {
        btn.classList.remove('loading');
    }
});