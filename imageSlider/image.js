let images = [
    "https://picsum.photos/id/1015/650/380",
    "https://picsum.photos/id/1016/650/380",
    "https://picsum.photos/id/1018/650/380",
    "https://picsum.photos/id/1020/650/380"
];

let index = 0;

// Show image
function showImage(){
    document.getElementById("slide").src = images[index];
}

// Next
function nextSlide(){
    index = (index + 1) % images.length;
    showImage();
}

// Previous
function prevSlide(){
    index = (index - 1 + images.length) % images.length;
    showImage();
}

// Auto slide every 3 sec
setInterval(nextSlide, 3000);

// Initial load
showImage();
