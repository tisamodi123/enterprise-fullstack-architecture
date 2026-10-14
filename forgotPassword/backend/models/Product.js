// const mongoose = require('mongoose');

// const productSchema = new mongoose.Schema({
//   id: { 
//     type: String, 
//     unique: true, 
//     required: [true, 'A product must have a unique custom string ID (e.g. JEWEL-101)'] 
//   },
//   name: { 
//     type: String, 
//     required: [true, 'Please provide the jewelry item name'] 
//   },
//   category: { 
//     type: String, 
//     required: [true, 'Product category is required (e.g., Rings, Earrings)'],
//     lowercase: true
//   },
//   basePriceUSD: { 
//     type: Number, 
//     required: [true, 'Please declare the baseline price in USD'] 
//   },
//   stock: { 
//     type: Number, 
//     default: 10 
//   },
//   imageUrl: { 
//     type: String, 
//     default: '' 
//   }
// }, { timestamps: true });

// module.exports = mongoose.models.Product || mongoose.model('Product', productSchema);
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  shape: { 
    type: String, 
    required: [true, 'Diamond shape is required (e.g., ROUND)'] 
  },
  color: { 
    type: String, 
    required: [true, 'Diamond color grade is required (e.g., D)'] 
  },
  clarity: { 
    type: String, 
    required: [true, 'Diamond clarity grade is required (e.g., IF)'] 
  },
  carat_from: { 
    type: Number, 
    required: [true, 'Starting carat weight boundary is required'] 
  },
  carat_to: { 
    type: Number, 
    required: [true, 'Ending carat weight boundary is required'] 
  },
  min_proc_price_per_ct: { 
    type: Number 
  },
  max_proc_price_per_ct: { 
    type: Number 
  },
  margin: { 
    type: Number 
  },
  selling_price_per_ct: { 
    type: Number, 
    required: [true, 'Selling price per carat is critical'] 
  }
}, { timestamps: true });

// Indexing for ultra-fast queries later when user searches specific ranges
productSchema.index({ shape: 1, color: 1, clarity: 1, carat_from: 1, carat_to: 1 }, { unique: true });

module.exports = mongoose.models.Product || mongoose.model('Product', productSchema);