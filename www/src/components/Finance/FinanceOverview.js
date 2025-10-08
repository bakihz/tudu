document.addEventListener("DOMContentLoaded", function () {
  function setDayHeader(id, offset) {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    document.getElementById(id).textContent = `${day}.${month}`;
  }
  setDayHeader("two-days-later", 2);
  setDayHeader("three-days-later", 3);
  setDayHeader("four-days-later", 4);
  setDayHeader("five-days-later", 5);
  setDayHeader("six-days-later", 6);
});
