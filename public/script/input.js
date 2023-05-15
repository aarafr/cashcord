const inputFields = document.querySelectorAll('.login input');

inputFields.forEach((input) => {
  input.addEventListener('input', () => {
    const label = document.querySelector('.login label');
    if (input.validity.valid && input.value !== '') {
      label.classList.add('input-active');
      label.classList.remove('input-invalid');
    } else {
      label.classList.remove('input-active');
      label.classList.add('input-invalid');
    }
  });
});