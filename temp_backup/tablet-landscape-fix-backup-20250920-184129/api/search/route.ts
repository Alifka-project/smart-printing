import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database-unified';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    
    console.log('🔍 Search API called with query:', query);
    
    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    const searchQuery = query.toLowerCase().trim();
    console.log('🔍 Processed search query:', searchQuery);
    const results = [];
    const dbService = new DatabaseService();

    // Search quotes
    try {
      console.log('🔍 Searching quotes...');
      const quotes = await dbService.getAllQuotes();
      console.log(`📊 Found ${quotes.length} quotes in database`);
      
      const quoteResults = quotes
        .filter(quote => {
          const matches = 
            quote.quoteId?.toLowerCase().includes(searchQuery) ||
            quote.client?.contactPerson?.toLowerCase().includes(searchQuery) ||
            quote.client?.companyName?.toLowerCase().includes(searchQuery) ||
            quote.product?.toLowerCase().includes(searchQuery) ||
            quote.productName?.toLowerCase().includes(searchQuery) ||
            quote.status?.toLowerCase().includes(searchQuery);
          
          if (matches) {
            console.log(`✅ Quote "${quote.quoteId}" matches search "${searchQuery}"`);
          }
          
          return matches;
        })
        .map(quote => ({
          id: quote.id,
          type: 'quote' as const,
          title: quote.quoteId || `Quote ${quote.id.slice(-6)}`,
          subtitle: `${quote.client?.contactPerson || quote.client?.companyName || 'Unknown Client'} - ${quote.product || quote.productName || 'Unknown Product'}`,
          data: quote
        }));
      
      console.log(`🎯 Found ${quoteResults.length} matching quotes`);
      results.push(...quoteResults);
    } catch (error) {
      console.error('❌ Error searching quotes:', error);
    }

    // Search clients
    try {
      const clients = await dbService.getAllClients();
      const clientResults = clients
        .filter(client => 
          client.contactPerson?.toLowerCase().includes(searchQuery) ||
          client.companyName?.toLowerCase().includes(searchQuery) ||
          client.email?.toLowerCase().includes(searchQuery) ||
          client.phone?.toLowerCase().includes(searchQuery) ||
          client.clientType?.toLowerCase().includes(searchQuery)
        )
        .map(client => ({
          id: client.id,
          type: 'client' as const,
          title: client.contactPerson || client.companyName || 'Unknown Client',
          subtitle: `${client.companyName ? client.companyName + ' - ' : ''}${client.email || 'No email'}${client.phone ? ' - ' + client.phone : ''}`,
          data: client
        }));
      results.push(...clientResults);
    } catch (error) {
      console.error('Error searching clients:', error);
    }

    // Search suppliers
    try {
      const suppliers = await dbService.getAllSuppliers();
      const supplierResults = suppliers
        .filter(supplier => 
          supplier.name?.toLowerCase().includes(searchQuery) ||
          supplier.email?.toLowerCase().includes(searchQuery) ||
          supplier.phone?.toLowerCase().includes(searchQuery) ||
          supplier.address?.toLowerCase().includes(searchQuery) ||
          supplier.city?.toLowerCase().includes(searchQuery)
        )
        .map(supplier => ({
          id: supplier.id,
          type: 'supplier' as const,
          title: supplier.name || 'Unknown Supplier',
          subtitle: `${supplier.email || 'No email'}${supplier.phone ? ' - ' + supplier.phone : ''}${supplier.city ? ' - ' + supplier.city : ''}`,
          data: supplier
        }));
      results.push(...supplierResults);
    } catch (error) {
      console.error('Error searching suppliers:', error);
    }

    // Search materials
    try {
      const materials = await dbService.getAllMaterials();
      const materialResults = materials
        .filter(material => 
          material.name?.toLowerCase().includes(searchQuery) ||
          material.type?.toLowerCase().includes(searchQuery) ||
          material.description?.toLowerCase().includes(searchQuery) ||
          material.supplier?.name?.toLowerCase().includes(searchQuery)
        )
        .map(material => ({
          id: material.id,
          type: 'material' as const,
          title: material.name || 'Unknown Material',
          subtitle: `${material.type || 'Unknown Type'}${material.supplier?.name ? ' - ' + material.supplier.name : ''}${material.description ? ' - ' + material.description.slice(0, 50) + '...' : ''}`,
          data: material
        }));
      results.push(...materialResults);
    } catch (error) {
      console.error('Error searching materials:', error);
    }

    // Search users
    try {
      const users = await dbService.getAllUsers();
      const userResults = users
        .filter(user => 
          user.name?.toLowerCase().includes(searchQuery) ||
          user.email?.toLowerCase().includes(searchQuery) ||
          user.role?.toLowerCase().includes(searchQuery) ||
          user.status?.toLowerCase().includes(searchQuery)
        )
        .map(user => ({
          id: user.id,
          type: 'user' as const,
          title: user.name || 'Unknown User',
          subtitle: `${user.email || 'No email'} - ${user.role || 'Unknown Role'}${user.status ? ' (' + user.status + ')' : ''}`,
          data: user
        }));
      results.push(...userResults);
    } catch (error) {
      console.error('Error searching users:', error);
    }

    // Search sales persons
    try {
      console.log('🔍 Searching sales persons...');
      const salesPersons = await dbService.getAllSalesPersons();
      console.log(`📊 Found ${salesPersons.length} sales persons in database`);
      console.log('Sample sales person:', salesPersons[0] || 'No sales persons found');
      
      const salesPersonResults = salesPersons
        .filter(salesPerson => {
          const matches = 
            salesPerson.name?.toLowerCase().includes(searchQuery) ||
            salesPerson.email?.toLowerCase().includes(searchQuery) ||
            salesPerson.salesPersonId?.toLowerCase().includes(searchQuery) ||
            salesPerson.phone?.toLowerCase().includes(searchQuery) ||
            salesPerson.designation?.toLowerCase().includes(searchQuery) ||
            salesPerson.department?.toLowerCase().includes(searchQuery) ||
            salesPerson.city?.toLowerCase().includes(searchQuery) ||
            salesPerson.state?.toLowerCase().includes(searchQuery) ||
            salesPerson.country?.toLowerCase().includes(searchQuery);
          
          if (matches) {
            console.log(`✅ Sales person "${salesPerson.name}" matches search "${searchQuery}"`);
          }
          
          return matches;
        })
        .map(salesPerson => ({
          id: salesPerson.id,
          type: 'salesPerson' as const,
          title: salesPerson.name || 'Unknown Sales Person',
          subtitle: `${salesPerson.salesPersonId || 'No ID'} - ${salesPerson.email || 'No email'}${salesPerson.phone ? ' - ' + salesPerson.phone : ''}${salesPerson.city ? ' - ' + salesPerson.city : ''}`,
          data: salesPerson
        }));
      
      console.log(`🎯 Found ${salesPersonResults.length} matching sales persons`);
      results.push(...salesPersonResults);
    } catch (error) {
      console.error('❌ Error searching sales persons:', error);
    }

    // Sort results by relevance (exact matches first, then partial matches)
    const sortedResults = results.sort((a, b) => {
      const aTitle = a.title.toLowerCase();
      const bTitle = b.title.toLowerCase();
      
      // Exact matches first
      if (aTitle === searchQuery && bTitle !== searchQuery) return -1;
      if (bTitle === searchQuery && aTitle !== searchQuery) return 1;
      
      // Starts with query
      if (aTitle.startsWith(searchQuery) && !bTitle.startsWith(searchQuery)) return -1;
      if (bTitle.startsWith(searchQuery) && !aTitle.startsWith(searchQuery)) return 1;
      
      // Contains query
      if (aTitle.includes(searchQuery) && !bTitle.includes(searchQuery)) return -1;
      if (bTitle.includes(searchQuery) && !aTitle.includes(searchQuery)) return 1;
      
      // Default sort by type and then by title
      if (a.type !== b.type) {
        const typeOrder = { quote: 1, client: 2, supplier: 3, material: 4, user: 5, salesPerson: 6 };
        return (typeOrder[a.type] || 0) - (typeOrder[b.type] || 0);
      }
      
      return aTitle.localeCompare(bTitle);
    });

    // Limit results to prevent overwhelming the UI
    const limitedResults = sortedResults.slice(0, 20);
    
    console.log(`🎯 Total results found: ${results.length}, returning: ${limitedResults.length}`);
    console.log('📋 Results:', limitedResults.map(r => ({ type: r.type, title: r.title })));
    
    return NextResponse.json(limitedResults);
  } catch (error) {
    console.error('Error performing search:', error);
    return NextResponse.json(
      { error: 'Failed to perform search' },
      { status: 500 }
    );
  }
}

