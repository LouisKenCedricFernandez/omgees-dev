import React from 'react';
import ingredients1 from '../images/ingredients1.jpg'
import tools1 from '../images/tools1.jpg'
import packaging1 from '../images/packaging1.jpg'


function Slider() {
    return (
            <div className="container-fluid px-2 px-md-3">
                <div id="carouselExampleCaptions" className="carousel slide custom-carousel" data-bs-ride="carousel">
                    <div className="carousel-indicators">
                        <button type="button" data-bs-target="#carouselExampleCaptions" data-bs-slide-to="0" className="active" aria-current="true" aria-label="Slide 1"></button>
                        <button type="button" data-bs-target="#carouselExampleCaptions" data-bs-slide-to="1" aria-label="Slide 2"></button>
                        <button type="button" data-bs-target="#carouselExampleCaptions" data-bs-slide-to="2" aria-label="Slide 3"></button>
                    </div>
                    <div className="carousel-inner">
                        <div className="carousel-item active">
                            <img src={ingredients1} class="img-fluid" className="d-block w-100" alt="Slide 1" />
                            <div className="carousel-caption d-none d-sm-block">
                                <h5>Premium Baking Ingredients</h5>
                                <p className="d-none d-md-block">Discover our wide selection of high-quality ingredients for all your baking needs.</p> {/* Show only on md and up */}
                            </div>
                        </div>
                        <div className="carousel-item">
                            <img src={tools1} class="img-fluid" className="d-block w-100" alt="Slide 2" />
                            <div className="carousel-caption d-none d-sm-block">
                                <h5>Professional Baking Tools</h5>
                                <p className="d-none d-md-block">Equip your kitchen with the best tools for professional-quality results.</p>
                            </div>
                        </div>
                        <div className="carousel-item">
                            <img src={packaging1} class="img-fluid" className="d-block w-100" alt="Slide 3" />
                            <div className="carousel-caption d-none d-sm-block">
                                <h5>Beautiful Packaging Solutions</h5>
                                <p className="d-none d-md-block">Present your creations with our elegant packaging options.</p>
                            </div>
                        </div>
                    </div>
                    <button className="carousel-control-prev" type="button" data-bs-target="#carouselExampleCaptions" data-bs-slide="prev">
                        <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                        <span className="visually-hidden">Previous</span>
                    </button>
                    <button className="carousel-control-next" type="button" data-bs-target="#carouselExampleCaptions" data-bs-slide="next">
                        <span className="carousel-control-next-icon" aria-hidden="true"></span>
                        <span className="visually-hidden">Next</span>
                    </button>
                </div>
            </div>
    );
}

export default Slider;