using NUnit.Framework;
using Moq;
using MongoDB.Driver;
using Microsoft.AspNetCore.Mvc;
using Notificacoes.API.Controllers;
using Notificacoes.API.Models;
using System.Threading;
using System.Threading.Tasks;

namespace Notificacoes.Tests
{
    public class NotificacoesControllerTests
    {
        private Mock<IMongoDatabase> _databaseMock = null!;
        private Mock<IMongoCollection<Notificacao>> _collectionMock = null!;
        private NotificacoesController _controller = null!;

        [SetUp]
        public void Setup()
        {
            _databaseMock = new Mock<IMongoDatabase>();
            _collectionMock = new Mock<IMongoCollection<Notificacao>>();

            _databaseMock
                .Setup(db => db.GetCollection<Notificacao>(
                    It.IsAny<string>(),
                    It.IsAny<MongoCollectionSettings>()))
                .Returns(_collectionMock.Object);

            _controller = new NotificacoesController(_databaseMock.Object);
        }

        [Test]
        public async Task Delete_IdExiste_RetornaNoContent()
        {
            var deleteResultMock = new Mock<DeleteResult>();
            deleteResultMock.Setup(x => x.DeletedCount).Returns(1);

            _collectionMock
                .Setup(c => c.DeleteOneAsync(
                    It.IsAny<FilterDefinition<Notificacao>>(),
                    It.IsAny<CancellationToken>()))
                .ReturnsAsync(deleteResultMock.Object);

            var result = await _controller.Delete(1);

            Assert.That(result, Is.InstanceOf<NoContentResult>());
        }

        [Test]
        public async Task Delete_IdNaoExiste_RetornaNotFound()
        {
            var deleteResultMock = new Mock<DeleteResult>();
            deleteResultMock.Setup(x => x.DeletedCount).Returns(0);

            _collectionMock
                .Setup(c => c.DeleteOneAsync(
                    It.IsAny<FilterDefinition<Notificacao>>(),
                    It.IsAny<CancellationToken>()))
                .ReturnsAsync(deleteResultMock.Object);

            var result = await _controller.Delete(1);

            Assert.That(result, Is.InstanceOf<NotFoundResult>());
        }

        [Test]
        public async Task MarcarComoLida_IdExiste_RetornaNoContent()
        {
            var updateResultMock = new Mock<UpdateResult>();
            updateResultMock.Setup(x => x.MatchedCount).Returns(1);

            _collectionMock
                .Setup(c => c.UpdateOneAsync(
                    It.IsAny<FilterDefinition<Notificacao>>(),
                    It.IsAny<UpdateDefinition<Notificacao>>(),
                    It.IsAny<UpdateOptions>(),
                    It.IsAny<CancellationToken>()))
                .ReturnsAsync(updateResultMock.Object);

            var result = await _controller.MarcarComoLida(1);

            Assert.That(result, Is.InstanceOf<NoContentResult>());
        }
    }
}