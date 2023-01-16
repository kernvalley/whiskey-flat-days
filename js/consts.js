export const title = 'Whiskey Flat Days';
export const GA = 'UA-156441506-1';
export const mapSelector = 'leaflet-map';
export const site = {
	title,
	markerIconBaseUri: document.baseURI,
};

export const icons = {
	markLocation: './img/adwaita-icons/actions/mark-location.svg',
};

export const startDate = new Date('2023-02-17T08:00:00');

export const endDate = new Date('2023-02-20T18:00:00');

/**
 * @see https://schema.org/ItemAvailability
 */
export const Availability = {
	InStock: 'In Stock',
	OutOfStock: 'Out of Stock',
	BackOrder: 'Back Order',
	Discontinued: 'Discontinued',
	InStoreOnly: 'In Store Only',
	LimitedAvailability: 'Limited Availability',
	OnlineOnly: 'Online Only',
	PreOrder: 'Pre-Order',
	PreSale: 'Pre-Sale',
	SoldOut: 'Sold Out',
};
