using Microsoft.Extensions.Options;
using ApiClientes.Models;
using ApiClientes.Settings;
using MongoDB.Driver;

namespace ApiClientes.Services
{
    public class ClienteService
    {
        private readonly IMongoCollection<Cliente> _clientes;

        public ClienteService(IOptions<MongoDbSettings> options)
{
    var settings = options.Value;

    var client = new MongoClient(settings.ConnectionString);
    var database = client.GetDatabase(settings.DatabaseName);
    _clientes = database.GetCollection<Cliente>(settings.ClientesCollectionName);
}


        public async Task<List<Cliente>> GetAsync() =>
            await _clientes.Find(_ => true).ToListAsync();

        public async Task<Cliente> GetByIdAsync(string id) =>
            await _clientes.Find(c => c.Id == id).FirstOrDefaultAsync();

        public async Task CreateAsync(Cliente cliente) =>
            await _clientes.InsertOneAsync(cliente);

        public async Task UpdateAsync(string id, Cliente cliente) =>
            await _clientes.ReplaceOneAsync(c => c.Id == id, cliente);

        public async Task DeleteAsync(string id) =>
            await _clientes.DeleteOneAsync(c => c.Id == id);
    }
}
