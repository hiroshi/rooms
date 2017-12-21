class User < ApplicationRecord
  has_many :credentials
  has_many :messages
  has_and_belongs_to_many :rooms
end
