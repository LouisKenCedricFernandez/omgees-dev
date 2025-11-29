import React from 'react';

function About() {
    return (
            <div className="container-fluid px-2 px-md-3">
                <div className="row">
                    <div className="col-12 text-center">
                        <h3 className="main-home">Welcome to OMGees' Official Website!</h3>
                            <div className="underline mx-auto" style={{ width: '1100px', maxWidth: '100%' }}></div> 
                            <div className="mx-auto" style={{ width: '1100px', maxWidth: '100%' }}>
                                <p className="text-secondary" style={{ fontSize: '1rem', lineHeight: '1.8', fontWeight: '400' }}>
                                    More than just a store, OMGees is a growing community where creativity and craftsmanship come together. 
                                    Whether you're a weekend baker experimenting with new recipes or a café owner creating treats for your customers, we're here to support your baking journey with quality, convenience, and expert guidance.
                                </p>
                            </div>
                    </div>
                </div> 
            </div>  
    );
}

export default About;